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

// Middleware to authenticate requests
const authenticate = (req, res, next) => {
    const token = req.header("Authorization");
    if (!token) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    Jwt.verify(token, jwtKey, (err, user) => {
        if (err) {
            return res.status(403).json({ error: "Invalid token" });
        }
        req.user = user;
        next();
    });
};

// Register a new user
app.post("/register", async (req, resp) => {
    try {
        let user = new User(req.body);
        let result = await user.save();
        result = result.toObject();
        delete result.password;
        resp.json({ result });
    } catch (err) {
        resp.status(500).json({ error: "Something went wrong" });
    }
});

// Login and get an authentication token
app.post("/login", async (req, resp) => {
    try {
        if (req.body.password && req.body.email) {
            let user = await User.findOne(req.body).select("-password");
            if (user) {
                Jwt.sign({ user }, jwtKey, { expiresIn: "2h" }, (err, token) => {
                    if (err) {
                        resp.status(500).json({ error: "Something went wrong" });
                    }
                    resp.json({ user, auth: token });
                });
            } else {
                resp.status(404).json({ error: "No User found" });
            }
        } else {
            resp.status(400).json({ error: "Missing email or password" });
        }
    } catch (err) {
        resp.status(500).json({ error: "Something went wrong" });
    }
});

// Add a product (requires authentication)
app.post("/add-product", authenticate, async (req, resp) => {
    try {
        const product = new Product(req.body);
        const result = await product.save();
        resp.json(result);
    } catch (err) {
        resp.status(500).json({ error: "Something went wrong" });
    }
});

// Get products (public)
app.get("/products",authenticate, async (req, resp) => {
    try {
        const products = await Product.find();
        resp.json(products);
    } catch (err) {
        resp.status(500).json({ error: "Something went wrong" });
    }
});

// Delete a product (requires authentication)
app.delete("/product/:id", authenticate, async (req, resp) => {
    try {
        const result = await Product.deleteOne({ _id: req.params.id });
        resp.json(result);
    } catch (err) {
        resp.status(500).json({ error: "Something went wrong" });
    }
});

// Get a product by ID (public)
app.get("/product/:id", async (req, resp) => {
    try {
        const result = await Product.findOne({ _id: req.params.id });
        if (result) {
            resp.json(result);
        } else {
            resp.status(404).json({ error: "No Record Found." });
        }
    } catch (err) {
        resp.status(500).json({ error: "Something went wrong" });
    }
});

// Update a product (requires authentication)
app.put("/product/:id", authenticate, async (req, resp) => {
    try {
        const result = await Product.updateOne(
            { _id: req.params.id },
            { $set: req.body }
        );
        resp.json(result);
    } catch (err) {
        resp.status(500).json({ error: "Something went wrong" });
    }
});

// Search for products by keyword (public)
app.get("/search/:key", async (req, resp) => {
    try {
        const result = await Product.find({
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
        resp.json(result);
    } catch (err) {
        resp.status(500).json({ error: "Something went wrong" });
    }
});

// Define a route to get the user's profile (requires authentication)
app.get("/profile", authenticate, async (req, resp) => {
    try {
        // Retrieve the user's profile based on their ID from the JWT token
        const user = await User.findById(req.user.user._id).select("-password");
        if (user) {
            resp.json(user);
        } else {
            resp.status(404).json({ error: "User not found" });
        }
    } catch (err) {
        resp.status(500).json({ error: "Something went wrong" });
    }
});

app.listen(5000, () => {
    console.log("Server is running on port 5000");
});
