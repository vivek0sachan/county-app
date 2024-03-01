const express = require('express');
const app = express();
const morgan=require('morgan');
const body_parser=require('body-parser');
const mongoose=require('mongoose');
const router=express.Router();

const config=require('./config');

const mongo_uri=config.uri;
mongoose.connect(mongo_uri)
.catch(()=>{
    console.log('Connection failed');
});

const countryRoutes=require('./apis/routes/country');

// middleware
app.use(morgan('dev'));
app.use('/country',countryRoutes);

app.get('/test', (req, res) => {
    res.status(200).json({
      message: 'Hello World'
    });
  });

app.use((req,res,next)=>{
    const error=new Error('Not found');
    error.status=404;
    next(error);
});

app.use((error,req,res,next)=>{
    res.status(error.status || 500);
    res.json({
        error:{
            message:error.message,

        }
    });
}
);



module.exports = app