const express = require("express");
const router = express.Router();

const supabase = require("../supabaseClient");

const estimateFoodSafety =
  require("../services/urgencyServices");



// Add food listing

router.post("/add", async (req, res) => {

  try {

    const {
      food_type,
      quantity,
      prep_time,
      location,
      latitude,
      longitude,
      donor_id
    } = req.body;


    if (!food_type || !quantity || !prep_time || !location || !donor_id)
      return res.status(400).json({
        error: "Missing required fields"
      });


    if (quantity <= 0)
      return res.status(400).json({
        error: "Quantity must be greater than 0"
      });


    const result =
      estimateFoodSafety(food_type, prep_time);


    const { data, error } =
      await supabase
        .from("food_listings")
        .insert({

          food_type,
          quantity,
          prep_time,
          location,
          latitude,
          longitude,
          donor_id,

          urgency:
            result.urgency,

          expiry_time:
            result.expiryTime,

          status:
            "available"

        })
        .select()
        .single();


    if (error)
      return res.status(400).json({
        error: error.message
      });


    res.json({

      message:
        "Food added successfully",

      food:
        data

    });

  }

  catch (err) {

    res.status(500).json({
      error: err.message
    });

  }

});




// Distance calculator

function calculateDistance(
  lat1, lon1, lat2, lon2
) {

  const R = 6371;

  const dLat =
    (lat2 - lat1) *
    Math.PI / 180;

  const dLon =
    (lon2 - lon1) *
    Math.PI / 180;


  const a =

    Math.sin(dLat/2) *
    Math.sin(dLat/2) +

    Math.cos(lat1*Math.PI/180) *
    Math.cos(lat2*Math.PI/180) *

    Math.sin(dLon/2) *
    Math.sin(dLon/2);


  const c =
    2 *
    Math.atan2(
      Math.sqrt(a),
      Math.sqrt(1-a)
    );


  return R*c;

}




// Nearby food

router.get("/nearby/:ngoId",
async (req,res)=>{

try{

const ngoId=
req.params.ngoId;


const {data:ngo,error}
=
await supabase
.from("users")
.select("latitude,longitude")
.eq("id",ngoId)
.single();


if(error||!ngo)
return res.status(400)
.json({error:"NGO location not found"});


const {data:foodListings}
=
await supabase
.from("food_listings")
.select("*")
.eq("status","available");


const updatedFood=

foodListings

.filter(food=>{

if(!food.latitude)
return false;


const distance=

calculateDistance(

ngo.latitude,
ngo.longitude,
food.latitude,
food.longitude

);

return distance<=15;

})

.map(food=>{

const result=

estimateFoodSafety(

food.food_type,
food.prep_time

);


if(new Date(result.expiryTime)<new Date())
return null;


return{

...food,

urgency:
result.urgency,

expiry_time:
result.expiryTime

};

})

.filter(Boolean);


res.json({

count:
updatedFood.length,

food:
updatedFood

});


}

catch(err){

res.status(500)
.json({error:err.message});

}

});




// Available food

router.get("/available",
async(req,res)=>{

try{

const {data}
=
await supabase
.from("food_listings")
.select("*")
.eq("status","available");


const updatedFood=

data

.map(food=>{

const result=

estimateFoodSafety(

food.food_type,
food.prep_time

);

if(new Date(result.expiryTime)<new Date())
return null;


return{

...food,

urgency:
result.urgency,

expiry_time:
result.expiryTime

};

})

.filter(Boolean);


res.json(updatedFood);

}

catch(err){

res.status(500)
.json({error:err.message});

}

});




// Request food

router.put("/request/:foodId",
async(req,res)=>{

try{

const {ngo_id}
=
req.body;


const {data,error}
=
await supabase
.from("food_listings")
.update({

requested_by:
ngo_id,

status:
"requested"

})
.eq("id",req.params.foodId)
.eq("status","available")
.select()
.single();


if(error||!data)
return res.status(400)
.json({error:"Food unavailable"});


res.json({

message:
"Food requested",

data

});


}

catch(err){

res.status(500)
.json({error:err.message});

}

});




// Complete donation

router.put("/complete/:foodId",
async(req,res)=>{

try{

const {data,error}
=
await supabase
.from("food_listings")
.update({

status:
"completed",

completed_at:
new Date().toISOString()

})
.eq("id",req.params.foodId)
.eq("status","requested")
.select()
.single();


if(error||!data)
return res.status(400)
.json({error:"Food not requested"});


res.json({

message:
"Donation completed",

data

});

}

catch(err){

res.status(500)
.json({error:err.message});

}

});



module.exports = router;
