
import mongoose from "mongoose";
import dotenv from "dotenv";
// import { apartmentDataList } from "./constants/data/apartment";
import { PrismaClient } from "@prisma/client";
const apartmentDataList = [
  {
    userid: "66476760ef11a9967074c22c",
    bedroom: 4,
    bathroom: 4,
    city: "London",
    address: "101 London Road",
    latitude: 51.5072,
    longitude: 0.1275,
    images: [
      "/images/images_1.jpg",
      "/images/images_2.jpg",
      "/images/images_3.jpg",
      "/images/images_4.jpg",
      "/images/images_5.jpg",
    ],
    title: "BeachFront Oasis",
    description:
      "Family room, nice and spacious with a double and single bed with the fabulous shower room. You won’t want to leave.",
    price: 70,
  },
  {
    userid: "66476760ef11a9967074c22c",
    bedroom: 4,
    bathroom: 4,
    city: "London",
    address: "",
    latitude: 50.8058,
    longitude: -1.0872,
    images: [
      "/images/images_6.jpg",
      "/images/images_22.jpg",
      "/images/images_23.jpg",
      "/images/images_4.jpg",
      "/images/images_5.jpg",
    ],
    title: "Cabins and TreeHouses",
    description:
      "Family room, nice and spacious with a double and single bed with the fabulous shower room. You won’t want to leave.",
    price: 70,
  },
  {
    userid: "66476760ef11a9967074c22c",
    bedroom: 4,
    bathroom: 4,
    city: "London",
    address: "",
    latitude: 52.9561,
    longitude: -1.1512,
    images: [
      "/images/images_7.jpg",
      "/images/images_8.jpg",
      "/images/images_3.jpg",
      "/images/images_4.jpg",
      "/images/images_5.jpg",
    ],
    title: "Cabins and TreeHouses",
    description:
      "Family room, nice and spacious with a double and single bed with the fabulous shower room. You won’t want to leave.",
    price: 70,
  },
  {
    userid: "66476760ef11a9967074c22c",
    bedroom: 4,
    bathroom: 4,
    city: "London",
    address: "",
    latitude: 50.8058,
    longitude: -1.0872,
    images: [
      "/images/images_10.jpg",
      "/images/images_2.jpg",
      "/images/images_3.jpg",
      "/images/images_4.jpg",
      "/images/images_5.jpg",
    ],
    title: "Playful Retreats",
    description:
      "Family room, nice and spacious with a double and single bed with the fabulous shower room. You won’t want to leave.",
    price: 70,
  },
  {
    userid: "66476760ef11a9967074c22c",
    bedroom: 4,
    bathroom: 4,
    city: "London",
    address: "",
    latitude: 51.4536,
    longitude:-2.5975,
    images: [
      "/images/images_11.jpg",
      "/images/images_2.jpg",
      "/images/images_13.jpg",
      "/images/images_12.jpg",
      "/images/images_5.jpg",
    ],
    title: "Monthly Retreats",
    description:
      "Family room, nice and spacious with a double and single bed with the fabulous shower room. You won’t want to leave.",
    price: 70,
  },
];


dotenv.config();

const prisma = new PrismaClient(); 
const mongoUrl = process.env.DATABASE_URL;
if (!mongoUrl) {
  throw new Error("MongoDB connection string is not defined.");
}

mongoose.connect(mongoUrl, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

mongoose.connection.on("error", (error) =>
  console.error("MongoDB connection error:", error)
);

const importData = async () => {
  try {
    // Use Prisma to insert data
    await prisma.rooms.createMany({
      data: apartmentDataList,
    });
    console.log("Data Imported!");
    process.exit();
  } catch (error) {
    console.error("Error importing data:", error);
    process.exit(1);
  }
};

const destroyData = async () => {
  try {
    // Use Prisma to delete data
    await prisma.rooms.deleteMany();
    console.log("Data Destroyed!");
    process.exit();
  } catch (error) {
    console.error("Error destroying data:", error);
    process.exit(1);
  }
};

if (process.argv[2] === "-d") {
  destroyData();
} else {
  importData();
}
