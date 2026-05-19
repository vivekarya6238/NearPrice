const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Product = require("./models/Product");
const PriceHistory = require("./models/PriceHistory");
const Vendor = require("./models/Vendor");

dotenv.config();

const products = [
    // vegetables
    { name: "Onion", category: "vegetables", description: "Fresh red onions", currentPrice: 35, unit: "kg", tags: ["onion", "pyaaz", "kanda"], image: "https://images.pexels.com/photos/144206/pexels-photo-144206.jpeg?w=400" },
    { name: "Tomato", category: "vegetables", description: "Fresh ripe tomatoes", currentPrice: 25, unit: "kg", tags: ["tomato", "tamatar"], image: "https://images.pexels.com/photos/1327838/pexels-photo-1327838.jpeg?w=400" },
    { name: "Potato", category: "vegetables", description: "Fresh potatoes", currentPrice: 20, unit: "kg", tags: ["potato", "aloo"], image: "https://images.pexels.com/photos/2286776/pexels-photo-2286776.jpeg?w=400" },
    { name: "Carrot", category: "vegetables", description: "Fresh orange carrots", currentPrice: 30, unit: "kg", tags: ["carrot", "gajar"], image: "https://images.pexels.com/photos/1306559/pexels-photo-1306559.jpeg?w=400" },
    { name: "Spinach", category: "vegetables", description: "Fresh green spinach", currentPrice: 15, unit: "kg", tags: ["spinach", "palak"], image: "https://images.pexels.com/photos/2325843/pexels-photo-2325843.jpeg?w=400" },
    { name: "Cauliflower", category: "vegetables", description: "Fresh cauliflower", currentPrice: 25, unit: "piece", tags: ["cauliflower", "gobhi"], image: "https://images.pexels.com/photos/2252584/pexels-photo-2252584.jpeg?w=400" },
    { name: "Capsicum", category: "vegetables", description: "Fresh capsicum", currentPrice: 40, unit: "kg", tags: ["capsicum", "shimla mirch"], image: "https://images.pexels.com/photos/594137/pexels-photo-594137.jpeg?w=400" },
    { name: "Brinjal", category: "vegetables", description: "Fresh purple brinjal", currentPrice: 20, unit: "kg", tags: ["brinjal", "baingan"], image: "https://images.pexels.com/photos/321551/pexels-photo-321551.jpeg?w=400" },

    // fruits
    { name: "Apple", category: "fruits", description: "Fresh Kashmir apples", currentPrice: 120, unit: "kg", tags: ["apple", "seb"], image: "https://images.pexels.com/photos/102104/pexels-photo-102104.jpeg?w=400" },
    { name: "Banana", category: "fruits", description: "Fresh yellow bananas", currentPrice: 40, unit: "dozen", tags: ["banana", "kela"], image: "https://images.pexels.com/photos/1093038/pexels-photo-1093038.jpeg?w=400" },
    { name: "Mango", category: "fruits", description: "Sweet Alphonso mangoes", currentPrice: 150, unit: "kg", tags: ["mango", "aam"], image: "https://images.pexels.com/photos/918643/pexels-photo-918643.jpeg?w=400" },
    { name: "Orange", category: "fruits", description: "Fresh juicy oranges", currentPrice: 60, unit: "kg", tags: ["orange", "santra"], image: "https://images.pexels.com/photos/portablesound/pexels-photo-portablesound.jpeg?w=400" },
    { name: "Papaya", category: "fruits", description: "Fresh ripe papaya", currentPrice: 30, unit: "kg", tags: ["papaya", "papita"], image: "https://images.pexels.com/photos/3671664/pexels-photo-3671664.jpeg?w=400" },

    // grocery
    { name: "Basmati Rice", category: "grocery", description: "Premium basmati rice", currentPrice: 80, unit: "kg", tags: ["rice", "chawal", "basmati"], image: "https://images.pexels.com/photos/4110251/pexels-photo-4110251.jpeg?w=400" },
    { name: "Tur Dal", category: "grocery", description: "Yellow tur dal", currentPrice: 120, unit: "kg", tags: ["dal", "tur dal", "arhar"], image: "https://images.pexels.com/photos/8501432/pexels-photo-8501432.jpeg?w=400" },
    { name: "Sugar", category: "grocery", description: "Refined white sugar", currentPrice: 45, unit: "kg", tags: ["sugar", "cheeni"], image: "https://images.pexels.com/photos/9510/pexels-photo-9510.jpeg?w=400" },
    { name: "Mustard Oil", category: "grocery", description: "Pure mustard oil", currentPrice: 180, unit: "litre", tags: ["oil", "mustard oil"], image: "https://images.pexels.com/photos/33783/olive-oil-salad-dressing-cooking-olive.jpg?w=400" },
    { name: "Wheat Flour", category: "grocery", description: "Fresh ground wheat flour", currentPrice: 35, unit: "kg", tags: ["flour", "atta", "wheat"], image: "https://images.pexels.com/photos/5765/flour-food-wheat-powder.jpg?w=400" },
    { name: "Salt", category: "grocery", description: "Iodized table salt", currentPrice: 20, unit: "kg", tags: ["salt", "namak"], image: "https://images.pexels.com/photos/4198370/pexels-photo-4198370.jpeg?w=400" },

    // electronics
    { name: "Earphones", category: "electronics", description: "Wired earphones with mic", currentPrice: 150, unit: "piece", tags: ["earphones", "headphones"], image: "https://images.pexels.com/photos/3394650/pexels-photo-3394650.jpeg?w=400" },
    { name: "USB Cable", category: "electronics", description: "Type-C charging cable", currentPrice: 80, unit: "piece", tags: ["usb cable", "charging cable"], image: "https://images.pexels.com/photos/4219866/pexels-photo-4219866.jpeg?w=400" },
    { name: "Phone Charger", category: "electronics", description: "5V fast charger adapter", currentPrice: 120, unit: "piece", tags: ["charger", "phone charger"], image: "https://images.pexels.com/photos/4526414/pexels-photo-4526414.jpeg?w=400" },

    // other
    { name: "Paracetamol", category: "other", description: "500mg paracetamol tablets", currentPrice: 15, unit: "piece", tags: ["paracetamol", "fever tablet"], image: "https://images.pexels.com/photos/139398/thermometer-headache-pain-pills-139398.jpeg?w=400" },
    { name: "Vitamin C", category: "other", description: "Vitamin C supplement tablets", currentPrice: 80, unit: "piece", tags: ["vitamin c", "supplement"], image: "https://images.pexels.com/photos/3683074/pexels-photo-3683074.jpeg?w=400" },
    { name: "Bandage", category: "other", description: "Sterile wound bandage", currentPrice: 25, unit: "piece", tags: ["bandage", "dressing"], image: "https://images.pexels.com/photos/1393382/pexels-photo-1393382.jpeg?w=400" },
];

const seedDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("MongoDB connected!");

        const vendor = await Vendor.findOne();
        if (!vendor) {
            console.log("No vendor found!");
            process.exit(1);
        }

        console.log(`Using vendor: ${vendor.shopName}`);

        // clear old products and price history
        await Product.deleteMany({ vendorId: vendor._id });
        await PriceHistory.deleteMany({ vendorId: vendor._id });
        console.log("Old products cleared!");

        // add products with 7 days price history
        for (const p of products) {
            const product = await Product.create({
                ...p,
                vendorId: vendor._id,
                isAvailable: true,
            });

            // generate 7 days price history — +-10% variation
            for (let i = 6; i >= 0; i--) {
                const date = new Date();
                date.setDate(date.getDate() - i);

                const variation = (Math.random() * 0.2 - 0.1) * p.currentPrice;
                const historyPrice = Math.round(p.currentPrice + variation);

                await PriceHistory.create({
                    productId: product._id,
                    vendorId: vendor._id,
                    price: historyPrice,
                    date,
                });
            }
        }

        console.log(`${products.length} products added with 7 day price history!`);
        process.exit(0);
    } catch (err) {
        console.error("Seed failed:", err.message);
        process.exit(1);
    }
};

seedDB();