import '../db.js';
import User from '../models/User.js';

// 10 dummy users
const users = [
  { fullName: "Ramesh Kumar", aadhaarNumber: "123456789001", email: "ramesh1@example.com", age: 30, phone: "9876543211" },
  { fullName: "Suman Devi", aadhaarNumber: "123456789002", email: "suman2@example.com", age: 32, phone: "9876543212" },
  { fullName: "Amit Yadav", aadhaarNumber: "123456789003", email: "amit3@example.com", age: 28, phone: "9876543213" },
  { fullName: "Neha Sharma", aadhaarNumber: "123456789004", email: "neha4@example.com", age: 26, phone: "9876543214" },
  { fullName: "Rajeev Gupta", aadhaarNumber: "123456789005", email: "rajeev5@example.com", age: 35, phone: "9876543215" },
  { fullName: "Kavita Singh", aadhaarNumber: "123456789006", email: "kavita6@example.com", age: 29, phone: "9876543216" },
  { fullName: "Pawan Meena", aadhaarNumber: "123456789007", email: "pawan7@example.com", age: 40, phone: "9876543217" },
  { fullName: "Anjali Verma", aadhaarNumber: "123456789008", email: "anjali8@example.com", age: 24, phone: "9876543218" },
  { fullName: "Vikas Chaudhary", aadhaarNumber: "123456789009", email: "vikas9@example.com", age: 31, phone: "9876543219" },
  { fullName: "Deepika Joshi", aadhaarNumber: "123456789010", email: "deepika10@example.com", age: 27, phone: "9876543220" }
];

for (let i = 0; i < users.length; i++) {
  const user = new User({
    ...users[i],
    address: {
      village: "Rampur",
      district: "Mathura",
      state: "UP",
      pincode: "281001"
    },
    preferredLanguage: "Hindi"
  });

  await user.save();
  console.log(`✅ User ${i + 1} saved: ${user.fullName}`);
}

process.exit();