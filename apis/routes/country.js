const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Country = require('../models/country');
const Neighbour = require('../models/neighbour');
const neighbour = require('../models/neighbour');
const e = require('express');

router.use(express.json()); 

// post country data
router.post('', (req, res, next) => {
    const country = new Country({
        country_id:req.body.id,
        name: req.body.name,
        cca: req.body.cca,
        currency_code: req.body.currency_code,
        currency: req.body.currency,
        capital: req.body.capital,
        region: req.body.region,
        subregion: req.body.subregion,
        area: req.body.area,
        map_url: req.body.map_url,
        population: req.body.population,
        flag_url: req.body.flag_url,
        created_at: req.body.created_at,
        updated_at: req.body.updated_at
    });
    // save the country data
    country.save()
    .catch(err => console.log(err));

    res.status(201).json({
        message: 'Handling POST requests to /country',
        createdCountry: country
    });

});

// fill country data in db from json file(data.json)
router.post('/fill', (req, res, next) => {
    const data = require('../../data.json');
    let id = 1;
    let datetime = new Date();
    data.forEach((element) => {
        const country = new Country({
            country_id: id++,
            name: element.name.official,
            cca: element.cca3,
            currency_code: Object.values(element.currencies)[0].symbol || '$',
            currency: Object.values(element.currencies)[0].name || 'Dollar',
            capital: Object.values(element.capital)[0],
            region: element.region,
            subregion: element.subregion,
            area: element.area,
            map_url: Object.values(element.maps)[0],
            population: element.population,
            flag_url: Object.values(element.flags)[0],
            created_at:datetime,
            updated_at: datetime
        });
        // save the country data
        country.save()
        .catch(err => console.log(err));
    });
    res.status(201).json({
        message: 'Handling POST requests to /country/fill'
    });
});

// fill neighbour using country data 
router.post('/fill-neighbours', async (req, res, next) => {
    try {
        let countries = await Country.find();
        neighbour_id = 1;

        for (let i = 0; i < countries.length; i++) {
            for (let j = i + 1; j < countries.length; j++) {
                if (countries[i].region === countries[j].region && countries[i].subregion === countries[j].subregion) {
                    let neighbour = new Neighbour({
                        neighbour_id: neighbour_id++,
                        country_id: countries[i].country_id,
                        neighbour_country_id: countries[j].country_id,
                        created_at: new Date(),
                        updated_at: new Date()
                    });

                    await neighbour.save();
                }
            }
        }

        res.status(200).send('Neighbours filled successfully');
    } catch (err) {
        console.log(err);
        res.status(500).send('Server error');
    }
});


router.get('/all', (req, res, next) => {
    let data;
    Country.find().then(documents => {
        data = documents;
        res.status(200).json({
            message: 'Country fetched successfully!',
            countries: data
        });
    });
}
);

router.get('',(req,res,next)=>{
    id = req.query.id;
    country_name= req.query.name;
    query={
        country_id:id,
        name:country_name
    };
    Country.find(query).then(documents => {
        data = documents;
        let message = 'Country fetched successfully!';
        if(data == null || data.length == 0){
            console.log('Country not found!');
            message = 'Country not found!';
        }
        res.status(200).json({
            message: message,
            countries: data
        });
    });
    res.status(200).json({
        message: 'Handling GET requests to /country'
    });
});

router.get('/:country_id', (req, res, next) =>{
    let  id=req.params.country_id;
    let data={}
    Country.findOne({country_id:id}).then(documents => {
        let message = 'Country fetched successfully!';
        if(documents == null || documents.length == 0){
            console.log('Country not found!');
            message = 'Country not found!';
        }
        else{
            data=documents;
        }

        res.status(200).json({
            message: message,
            countries: data
        });
    });
} 
);


router.get('/neighbours/:country_id', (req, res, next) =>{
    neighbours=[];
    let  country_id=req.params.country_id;
    let message = 'Neighbours fetched successfully!';

    country=Country.findOne({country_id:country_id}).then(documents => {

    if (documents == null || documents.length == 0){
        console.log('Country not found!');
        res.status(200).json({
            message: 'Country not found!',
            countries: []
        });
    }

    else{
            Neighbour.find({country_id:country_id}).then(data => {
            data.forEach((element)=>{
                neighbours.push(element.neighbour_country_id);
            });

        Country.find({country_id:{$in:neighbours}}).then(data => {
            res.status(200).json({
                message: 'Neighbours fetched successfully!',
                countries: data
            });
            }
            );
    }
    );}
}
);
});

// api with search sort and pagination  search a countries by:Name Region Subregion
function validateParams(req, res, next) {
    let page = req.query.page || 1;
    let per_page = req.query.per_page|| 10;
    let sort = req.query.sort || 'a_to_z';
    let region = req.query.region || '';
    let subregion = req.query.subregion || '';
    let name = req.query.name || '';

    if (page && isNaN(page)) {
        res.status(400).send('Invalid page');
    } else if (per_page && isNaN(per_page)) {

    } else if (sort && !['a_to_z', 'z_to_a', 'population_high_to_low','population_low_to_high',
        'area_high_to_low', 'area_low_to_high'].includes(sort)) {
        res.status(400).send('Invalid sort');
    } else if ( typeof region !== 'string') {
        res.status(400).send('Invalid region');
    } else if ( typeof subregion !== 'string') {
        res.status(400).send('Invalid subregion');
    }else if(typeof name !== 'string'){
        res.status(400).send('Invalid name');
    }
    else {
        next();
    }
}


// router.get('/search', validateParams, async (req, res) => {
//     const { name, page = 1, per_page = 10, sort, region, subregion } = req.query;
//     let query = {};
//     if (name) {
//         query.name = { $regex: name, $options: 'i' }; 
//     }
//     if (region) {
//         query.region = { $regex: region, $options: 'i'}
//     }
//     if (subregion) {
//         query.subregion = { $regex: subregion, $options: 'i' }
//     }

//     // Create the options
//     let options = {
//         sort: {},
//         page: parseInt(page, 10),
//         limit: parseInt(per_page, 10)
//     };
//     if (sort) {
//         options.sort[sort] = 1; // Sort by the provided field
//     }

//     try {
//         // Execute the query with pagination
//         const result = await Country.paginate(query, options);

//         res.status(200).json({
//             message: 'Countries fetched successfully!',
//             countries: result.docs,
//             totalPages: result.totalPages,
//             currentPage: result.page,
//             hasnext: result.hasNextPage,
//         });
//     } catch (err) {
//         console.error('Error fetching countries:', err);
//         res.status(500).json({ message: 'Error fetching countries' });
//     }
// });



module.exports = router;

