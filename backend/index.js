const express = require("express");
const cors = require("cors");
require("./db/config");
const User = require('./db/User');
const Product = require("./db/Product")
const Jwt = require('jsonwebtoken');
const jwtKey = 'e-com';
const app = express();

app.use(express.json());
app.use(cors());

app.post("/register", async (req, resp) => {
    let user = new User(req.body);
    let result = await user.save();
    result = result.toObject();
    delete result.password
    Jwt.sign({result}, jwtKey, {expiresIn:"2h"},(err,token)=>{
        if(err){
            resp.send("Something went wrong")  
        }
        console.log(" Token:", token);
        resp.send({result,auth:token})
    })
})

app.post("/login", async (req, resp) => {
    if (req.body.password && req.body.email) {
        let user = await User.findOne(req.body).select("-password");
        if (user) {
            Jwt.sign({user}, jwtKey, {expiresIn:"2h"},(err,token)=>{
                if(err){
                    resp.send("Something went wrong")  
                }

                console.log(" Token:", token);
                resp.send({user,auth:token})
            })
        } else {
            resp.send({ result: "No User found" })
        }
    } else {
        resp.send({ result: "No User found" })
    }
});

app.post("/add-product", verifyToken, async (req, resp) => {
    try {
        const token = req.headers['authorization'].split(' ')[1];
        const decodedToken = Jwt.verify(token, jwtKey);

        const userId = decodedToken.result._id || decodedToken.user._id; // Assuming "_id" is the user's unique identifier

        // Now, you can use `userId` to associate the product with the authenticated user.
        const product = new Product({ ...req.body, userId });
        const result = await product.save();
        resp.send(result);
    } catch (error) {
        console.error("Error adding product:", error);
        resp.status(500).json({ error: "Failed to add product" });
    }
});

app.get("/products", verifyToken, async (req, resp) => {
    try {
        const token = req.headers['authorization'].split(' ')[1];
        const decodedToken = Jwt.verify(token, jwtKey);
        console.log("Decoded Token:", decodedToken);

        // Use the appropriate property based on the payload structure
        const userId = decodedToken.result ? decodedToken.result._id : decodedToken.user._id;
        console.log("UserId:", userId);

        const products = await Product.find({ userId });
        console.log("Products:", products);

        if (products.length > 0) {
            resp.send(products);
        } else {
            resp.send({ result: "No Product found" });
        }
    } catch (error) {
        console.error("Error fetching products:", error);
        resp.status(500).json({ error: "Failed to fetch products" });
    }
});


app.delete("/product/:id",verifyToken ,async (req, resp) => {
    let result = await Product.deleteOne({ _id: req.params.id });
    resp.send(result)
}),

    app.get("/product/:id",verifyToken ,async (req, resp) => {
        let result = await Product.findOne({ _id: req.params.id })
        if (result) {
            resp.send(result)
        } else {
            resp.send({ "result": "No Record Found." })
        }
    })

app.put("/product/:id", verifyToken,async (req, resp) => {
    let result = await Product.updateOne(
        { _id: req.params.id },
        { $set: req.body }
    )
    resp.send(result)
});

app.put("/product/:id",verifyToken ,async (req, resp) => {
    let result = await Product.updateOne(
        { _id: req.params.id },
        { $set: req.body }
    )
    resp.send(result)
});

app.get("/search/:key",verifyToken,async (req, resp) => {
    let result = await Product.find({
        "$or": [
            {
                name: { $regex: req.params.key }  
            },
            {
                company: { $regex: req.params.key }
            },
            {
                category: { $regex: req.params.key }
            }
        ]
    });
    resp.send(result);
});


function verifyToken(req, resp, next) {
    let token = req.headers['authorization'];
    if (token) {
        token = token.split(' ')[1];
        Jwt.verify(token, jwtKey, (err, decodedToken) => {
            if (err) {
                resp.send({ result: "please provide valid token" });
            } else {
                // Use the appropriate property based on the payload structure
                const userId = decodedToken.result ? decodedToken.result._id : decodedToken.user._id;
                req.userId = userId; // Attach userId to the request for later use
                next();
            }
        });
    } else {
        resp.send({ result: "please add token with headers" });
    }
}



app.listen(5000);
