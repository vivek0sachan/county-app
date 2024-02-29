const mongoose=require('mongoose');

const neighbourSchema=mongoose.Schema({
    neighbour_id:Number,
    country_id:Number,
    neighbour_country_id:Number,
    created_at:Date,
    updated_at:Date
});

module.exports=mongoose.model('Neighbour',neighbourSchema);