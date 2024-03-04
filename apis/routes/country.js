const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Country = require('../models/country');
const Neighbour = require('../models/neighbour');

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


router.get('', (req, res, next) => {

    let page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;
    const sort_by=req.query.sort_by || 'a_to_z';
    const c_name=req.query.name || '';
    const region=req.query.region || '';
    const subregion = req.query.subregion || '';

    let total;

    query={};
    if (c_name!='')
    {
        query.name = { $regex: new RegExp(c_name, "i") };
    }
    else if(region!='')
    {
        query.region={$regex: new RegExp(region, "i")};
    }
    else if(subregion!='')
    {
        query.subregion={$regex: new RegExp(subregion, "i")};
    }

    Country.countDocuments()
        .then(count => {
            total = count;
            if (page === -1) {
                // If page is -1, return all documents
                return Country.find(query);
            } else {
                // Otherwise, return documents for the current page
                return Country.find(query).sort(sort_param(sort_by)).skip(skip).limit(limit);
            }
        })
        .then(countries => {
            res.json({
                page: page,
                total: total,
                items: countries.length,
                has_next: countries.length === limit,
                has_prev: page > 1,
                countries: countries
            });
        })
        .catch(err => {
            next(err);
        });
});

function sort_param(sort_by){
    switch (sort_by) {
        case 'a_to_z':{
            return { name: 1 };
        }
        case 'z_to_a':{
            return { name: -1 };
        };
        case 'population_high_to_low':{
            return { population: -1 };
        };
        case 'population_low_to_high':{
            return { population: 1 };
        };

        case 'area_high_to_low':{
            return { area: -1 };
        };
        case 'area_low_to_high':{
            return { area: 1 };
        };
        default:{
            return { name: 1 };
        }
    }
}




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

module.exports = router;

