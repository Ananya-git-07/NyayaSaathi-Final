import '../db.js';
import Subscription from '../models/Subscription.js';
import Kiosk from '../models/Kiosk.js';
import User from '../models/User.js';

const createDummySubscription = async () => {
  try {
    const kiosk = await Kiosk.findOne({ isDeleted: false });
    if (!kiosk) {
      console.log('⚠️ No active Kiosk found. Add one first.');
      process.exit(1);
    }

    const influencer = await User.findOne({ isDeleted: false });
    if (!influencer) {
      console.log('⚠️ No active User found. Add one first.');
      process.exit(1);
    }

    const sub1 = await Subscription.create({
      organizationType: 'Kiosk',
      organizationRef: kiosk._id,
      plan: 'Premium',
      amountPaid: 5000,
      paymentDate: new Date(),
      expiryDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
      paymentStatus: 'Active',
      isDeleted: false
    });
    console.log(`✅ Subscription created for Kiosk: ${kiosk.location}`);

    const sub2 = await Subscription.create({
      organizationType: 'Independent',
      organizationRef: influencer._id,
      plan: 'Basic',
      amountPaid: 1500,
      paymentDate: new Date(),
      expiryDate: new Date(new Date().setMonth(new Date().getMonth() + 6)),
      paymentStatus: 'Active',
      isDeleted: false
    });
    console.log(`✅ Subscription created for Influencer: ${influencer.fullName}`);

    process.exit(0);

  } catch (err) {
    console.error('❌ Error adding subscriptions:', err.message);
    process.exit(1);
  }
};

createDummySubscription();