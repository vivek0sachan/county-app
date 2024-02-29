const mongoose=require('mongoose');

const countrySchema=mongoose.Schema({
    id:mongoose.Schema.Types.ObjectId,
    country_id:Number,
    name:String,
    cca:String,
    currency_code:String,
    currency:String,
    capital:String,
    region:String,
    subregion:String,
    area:Number,
    map_url:String,
    population:Number,
    flag_url:String,
    created_at:Date,
    updated_at:Date
});

module.exports=mongoose.model('Country',countrySchema);