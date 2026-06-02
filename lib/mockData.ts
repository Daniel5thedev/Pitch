"use client";

export interface MockReview {
  id: string;
  targetId: string;
  userName: string;
  userImage: string;
  rating: number;
  comment: string;
  date: string;
}

export interface MockVenue {
  id: string;
  name: string;
  category: "Football" | "Basketball" | "Tennis" | "Padel" | "Volleyball";
  rating: number;
  reviewsCount: number;
  image: string;
  gallery: string[];
  pricePerHour: number;
  status: "Available" | "Fully Booked" | "Maintenance";
  size: string;
  type: string;
  indoor: boolean;
  location: string;
  description: string;
  amenities: string[];
  slots: string[];
}

export interface MockCoach {
  id: string;
  name: string;
  specialty: "Tactics" | "Conditioning" | "Shooting" | "Goalkeeping" | "All-Rounder";
  rating: number;
  reviewsCount: number;
  image: string;
  pricePerHour: number;
  experience: string;
  certifications: string[];
  bio: string;
  slots: string[];
}

export interface MockBooking {
  id: string;
  type: "venue" | "coach";
  targetId: string;
  targetName: string;
  targetImage: string;
  slotDate: string;
  slotTime: string;
  price: number;
  status: "CONFIRMED" | "PENDING_HOLD" | "CANCELLED";
  bookingRef: string;
  createdAt: string;
}

export interface MockWalletTx {
  id: string;
  amount: number;
  type: "TOPUP" | "PAYMENT" | "REFUND";
  description: string;
  date: string;
}

export interface MockNotification {
  id: string;
  title: string;
  message: string;
  type: "booking" | "payment" | "system";
  date: string;
  read: boolean;
}

// Initial Data Seed
const INITIAL_VENUES: MockVenue[] = [
  {
    id: "v1",
    name: "Riverside Grand Arena",
    category: "Football",
    rating: 4.9,
    reviewsCount: 142,
    image: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=800&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1529900748604-07564a03e7a6?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1575361204480-aadea25e6e68?auto=format&fit=crop&w=800&q=80"
    ],
    pricePerHour: 3500,
    status: "Available",
    size: "11-a-side",
    type: "Premium Pro Grass",
    indoor: false,
    location: "Riverside Drive, Nairobi",
    description: "Experience the pinnacle of football matches at Riverside Grand. Designed for full 11-a-side matches with championship-grade synthetic turf, high-intensity floodlighting, and electronic scoreboards.",
    amenities: ["Floodlights", "Locker Rooms", "Free Parking", "Showered Toilets", "Juice Bar"],
    slots: ["08:00", "10:00", "12:00", "14:00", "16:00", "18:00", "20:00", "22:00"]
  },
  {
    id: "v2",
    name: "Kilimani Indoor Cage",
    category: "Football",
    rating: 4.7,
    reviewsCount: 88,
    image: "https://images.unsplash.com/photo-1575361204480-aadea25e6e68?auto=format&fit=crop&w=800&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1575361204480-aadea25e6e68?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1459865264687-595d652de67e?auto=format&fit=crop&w=800&q=80"
    ],
    pricePerHour: 2200,
    status: "Available",
    size: "5-a-side",
    type: "Shock-absorbing synthetic",
    indoor: true,
    location: "Chania Avenue, Kilimani",
    description: "Rain or shine, lock your game in Kilimani's best indoor cage. Perfect for fast-paced 5-a-side games under bright LED rigs and shock-absorbing rubber padding.",
    amenities: ["Indoor AC", "Locker Rooms", "Free Wi-Fi", "Water Dispenser"],
    slots: ["09:00", "11:00", "13:00", "15:00", "17:00", "19:00", "21:00"]
  },
  {
    id: "v3",
    name: "Apex Padel Club",
    category: "Padel",
    rating: 4.8,
    reviewsCount: 64,
    image: "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=800&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1599447421416-3414500d18a5?auto=format&fit=crop&w=800&q=80"
    ],
    pricePerHour: 2800,
    status: "Available",
    size: "Double Court",
    type: "Panoramic Glass Padel Turf",
    indoor: true,
    location: "Westlands Mall Rooftop",
    description: "Play padel on Nairobi's premium rooftop court. Features panoramic view glass panels, vibrant neon lighting, and high-bounce blue turf.",
    amenities: ["Panoramic Glass", "Pro Shop", "Cafe Bar", "Equipment Rental", "Showers"],
    slots: ["07:00", "09:00", "11:00", "13:00", "15:00", "17:00", "19:00", "21:00"]
  },
  {
    id: "v4",
    name: "The Garden Tennis Courts",
    category: "Tennis",
    rating: 4.6,
    reviewsCount: 52,
    image: "https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?auto=format&fit=crop&w=800&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?auto=format&fit=crop&w=800&q=80"
    ],
    pricePerHour: 1800,
    status: "Available",
    size: "Singles/Doubles",
    type: "Clay Court",
    indoor: false,
    location: "Lavington Green, Nairobi",
    description: "Classic red clay tennis courts surrounded by beautiful greenery. Recommended for players seeking comfortable clay-slide games and long rallies.",
    amenities: ["Red Clay", "Spectator Stand", "Coaches Lounge", "Juice Bar"],
    slots: ["08:00", "10:00", "12:00", "14:00", "16:00", "18:00"]
  },
  {
    id: "v5",
    name: "Vanguard Basketball Dome",
    category: "Basketball",
    rating: 4.9,
    reviewsCount: 110,
    image: "https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=800&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1519766304817-4f37bda74a27?auto=format&fit=crop&w=800&q=80"
    ],
    pricePerHour: 2600,
    status: "Available",
    size: "Full Professional FIBA",
    type: "USA Hardwood Maple",
    indoor: true,
    location: "Ngong Road, Adams",
    description: "Shoot hoops in a state-of-the-art FIBA standard hardwood court. Features adjustable glass backboards, professional 24s shot-clocks, and grandstand seating.",
    amenities: ["FIBA Hardwood", "Shot Clocks", "AC Cooling", "Locker Rooms", "Physio Room"],
    slots: ["09:00", "11:00", "13:00", "15:00", "17:00", "19:00", "21:00", "23:00"]
  },
  {
    id: "v6",
    name: "Skyline Volleyball Hub",
    category: "Volleyball",
    rating: 4.5,
    reviewsCount: 38,
    image: "https://images.unsplash.com/photo-1592656094267-764a45068526?auto=format&fit=crop&w=800&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1592656094267-764a45068526?auto=format&fit=crop&w=800&q=80"
    ],
    pricePerHour: 1500,
    status: "Maintenance",
    size: "Standard Olympic",
    type: "Impact Rubber Flooring",
    indoor: true,
    location: "Thika Road, Roysambu",
    description: "Designed for high-impact professional volleyball games. Currently undergoing routine net and floor shock tension tuning.",
    amenities: ["AC Cooling", "Tuned Netting", "Free Parking"],
    slots: ["08:00", "10:00", "12:00", "14:00", "16:00", "18:00"]
  }
];

const INITIAL_COACHES: MockCoach[] = [
  {
    id: "c1",
    name: "Coach David Mwangi",
    specialty: "Tactics",
    rating: 4.9,
    reviewsCount: 47,
    image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80",
    pricePerHour: 1800,
    experience: "12 Years",
    certifications: ["UEFA A License", "CAF Elite A Coach", "FIFA Youth Academy Leader"],
    bio: "Ex-Professional midfield general specializing in off-the-ball tactical positioning, passing geometry, and game reading. Guided 4 local academy players to major European trial calls.",
    slots: ["09:00", "11:00", "14:00", "16:00"]
  },
  {
    id: "c2",
    name: "Coach Elena Rostova",
    specialty: "Conditioning",
    rating: 4.8,
    reviewsCount: 31,
    image: "https://images.unsplash.com/photo-1548690312-e3b507d8c110?auto=format&fit=crop&w=800&q=80",
    pricePerHour: 1500,
    experience: "8 Years",
    certifications: ["NCSF Certified Strength Trainer", "EXOS Speed Specialist"],
    bio: "High-intensity athletic conditioning expert. Focuses on acceleration mechanics, agility matrices, injury prevention, and building peak stamina.",
    slots: ["08:00", "10:00", "15:00", "17:00"]
  },
  {
    id: "c3",
    name: "Coach Marcus Bent",
    specialty: "Shooting",
    rating: 4.9,
    reviewsCount: 54,
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80",
    pricePerHour: 2200,
    experience: "15 Years",
    certifications: ["FA Advanced Striker Coach", "UEFA B License"],
    bio: "Former professional striker. Specializes in advanced ball striking, penalty area runs, weak foot power development, and composed finishing under pressure.",
    slots: ["09:00", "10:00", "11:00", "14:00", "15:00", "16:00"]
  },
  {
    id: "c4",
    name: "Coach Salim Kipsang",
    specialty: "Goalkeeping",
    rating: 4.7,
    reviewsCount: 22,
    image: "https://images.unsplash.com/photo-1628157582853-a796fa650a6a?auto=format&fit=crop&w=800&q=80",
    pricePerHour: 1600,
    experience: "10 Years",
    certifications: ["FIFA Goalkeeper Coach Cert", "CAF Pro Goal Trainer"],
    bio: "Specialist goalkeeper trainer. Develops explosive reaction saves, cross interception techniques, and proactive distribution play.",
    slots: ["08:00", "11:00", "13:00", "16:00"]
  }
];

const INITIAL_REVIEWS: MockReview[] = [
  {
    id: "r1",
    targetId: "v1",
    userName: "Alex Kamau",
    userImage: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=80&q=80",
    rating: 5,
    comment: "The lighting system at Riverside is absolutely insane! Felt like a real Champions League night. Worth every single shilling.",
    date: "2026-05-27"
  },
  {
    id: "r2",
    targetId: "v1",
    userName: "Captain Cynthia",
    userImage: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=80&q=80",
    rating: 4.8,
    comment: "Very easy to book. The turf is exceptionally well kept and there's plenty of parking for my teammates.",
    date: "2026-05-25"
  },
  {
    id: "r3",
    targetId: "c1",
    userName: "Brian Ochieng",
    userImage: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&q=80",
    rating: 5,
    comment: "Coach David has completely revolutionized how I read space on the pitch. My passing percentage is up 20% in standard matches!",
    date: "2026-05-26"
  },
  {
    id: "r4",
    targetId: "v3",
    userName: "Fatma Said",
    userImage: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=80&q=80",
    rating: 4.8,
    comment: "Clean panoramic glass padel courts! Best padel vibe in Westlands. Recommended to book the sunset slots.",
    date: "2026-05-28"
  }
];

const INITIAL_NOTIFICATIONS: MockNotification[] = [
  {
    id: "n1",
    title: "Welcome to Kahawa Sport Arena!",
    message: "Top up your wallet via M-Pesa to instantly lock in premium pitch booking holds.",
    type: "system",
    date: new Date(Date.now() - 3600000 * 24).toISOString(),
    read: false
  }
];

export class MockDatabase {
  private static isClient() {
    return typeof window !== "undefined";
  }

  private static get<T>(key: string, defaultValue: T): T {
    if (!this.isClient()) return defaultValue;
    const item = localStorage.getItem(`ds_db_${key}`);
    if (!item) {
      this.set(key, defaultValue);
      return defaultValue;
    }
    try {
      return JSON.parse(item);
    } catch {
      return defaultValue;
    }
  }

  private static set(key: string, value: any) {
    if (this.isClient()) {
      localStorage.setItem(`ds_db_${key}`, JSON.stringify(value));
    }
  }

  // --- API ---

  public static getVenues(): MockVenue[] {
    return this.get<MockVenue[]>("venues", INITIAL_VENUES);
  }

  public static getVenueById(id: string): MockVenue | undefined {
    return this.getVenues().find(v => v.id === id);
  }

  public static updateVenue(venue: MockVenue) {
    const venues = this.getVenues().map(v => v.id === venue.id ? venue : v);
    this.set("venues", venues);
  }

  public static getCoaches(): MockCoach[] {
    return this.get<MockCoach[]>("coaches", INITIAL_COACHES);
  }

  public static getCoachById(id: string): MockCoach | undefined {
    return this.getCoaches().find(c => c.id === id);
  }

  public static getReviews(targetId: string): MockReview[] {
    return this.get<MockReview[]>("reviews", INITIAL_REVIEWS).filter(r => r.targetId === targetId);
  }

  public static addReview(targetId: string, userName: string, rating: number, comment: string) {
    const reviews = this.get<MockReview[]>("reviews", INITIAL_REVIEWS);
    const newReview: MockReview = {
      id: "rev_" + Math.random().toString(36).substr(2, 9),
      targetId,
      userName,
      userImage: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&q=80",
      rating,
      comment,
      date: new Date().toISOString().split("T")[0]
    };
    reviews.push(newReview);
    this.set("reviews", reviews);

    // Update rating count
    const venue = this.getVenueById(targetId);
    if (venue) {
      const allTargetReviews = reviews.filter(r => r.targetId === targetId);
      const avgRating = allTargetReviews.reduce((sum, r) => sum + r.rating, 0) / allTargetReviews.length;
      venue.rating = parseFloat(avgRating.toFixed(1));
      venue.reviewsCount = allTargetReviews.length;
      this.updateVenue(venue);
    } else {
      const coach = this.getCoachById(targetId);
      if (coach) {
        const allTargetReviews = reviews.filter(r => r.targetId === targetId);
        const avgRating = allTargetReviews.reduce((sum, r) => sum + r.rating, 0) / allTargetReviews.length;
        coach.rating = parseFloat(avgRating.toFixed(1));
        coach.reviewsCount = allTargetReviews.length;
        // Update coach
        const coaches = this.getCoaches().map(c => c.id === coach.id ? coach : c);
        this.set("coaches", coaches);
      }
    }
  }

  public static getBookings(): MockBooking[] {
    return this.get<MockBooking[]>("bookings", []);
  }

  public static createBooking(type: "venue" | "coach", targetId: string, slotDate: string, slotTime: string): MockBooking {
    const bookings = this.getBookings();
    
    let targetName = "";
    let targetImage = "";
    let price = 0;

    if (type === "venue") {
      const v = this.getVenueById(targetId);
      if (v) {
        targetName = v.name;
        targetImage = v.image;
        price = v.pricePerHour;
      }
    } else {
      const c = this.getCoachById(targetId);
      if (c) {
        targetName = c.name;
        targetImage = c.image;
        price = c.pricePerHour;
      }
    }

    const newBooking: MockBooking = {
      id: "b_" + Math.random().toString(36).substr(2, 9),
      type,
      targetId,
      targetName,
      targetImage,
      slotDate,
      slotTime,
      price,
      status: "CONFIRMED",
      bookingRef: "REF-" + Math.floor(100000 + Math.random() * 900000),
      createdAt: new Date().toISOString()
    };

    bookings.push(newBooking);
    this.set("bookings", bookings);

    // Trigger payment in ledger
    this.addWalletTx(-price, "PAYMENT", `Booking reservation for ${targetName}`);

    // Create system notification
    this.addNotification(
      "Booking Confirmed!",
      `Successfully booked slot on ${slotDate} at ${slotTime} for ${targetName}. Reference: ${newBooking.bookingRef}`,
      "booking"
    );

    return newBooking;
  }

  public static cancelBooking(bookingId: string) {
    const bookings = this.getBookings();
    const booking = bookings.find(b => b.id === bookingId);
    if (booking && booking.status !== "CANCELLED") {
      booking.status = "CANCELLED";
      this.set("bookings", bookings);

      // Refund payment
      this.addWalletTx(booking.price, "REFUND", `Cancelled reservation for ${booking.targetName}`);

      this.addNotification(
        "Booking Cancelled & Refunded",
        `Your reservation for ${booking.targetName} has been cancelled. Refund of KES ${booking.price} credited back to your wallet.`,
        "booking"
      );
    }
  }

  public static getWalletBalance(): number {
    return this.get<number>("wallet_balance", 7500); // Pre-fill with KES 7,500
  }

  public static getWalletTransactions(): MockWalletTx[] {
    const defaultTx: MockWalletTx[] = [
      {
        id: "tx_1",
        amount: 10000,
        type: "TOPUP",
        description: "M-Pesa Topup Deposit (Ref: RH45TY72U)",
        date: new Date(Date.now() - 3600000 * 48).toISOString()
      },
      {
        id: "tx_2",
        amount: -2500,
        type: "PAYMENT",
        description: "Court Reservation Deposit Riverside",
        date: new Date(Date.now() - 3600000 * 20).toISOString()
      }
    ];
    return this.get<MockWalletTx[]>("wallet_transactions", defaultTx);
  }

  public static addWalletTx(amount: number, type: "TOPUP" | "PAYMENT" | "REFUND", description: string) {
    const txs = this.getWalletTransactions();
    const balance = this.getWalletBalance();
    
    const newTx: MockWalletTx = {
      id: "tx_" + Math.random().toString(36).substr(2, 9),
      amount,
      type,
      description,
      date: new Date().toISOString()
    };

    txs.push(newTx);
    this.set("wallet_transactions", txs);
    this.set("wallet_balance", balance + amount);

    if (type === "TOPUP") {
      this.addNotification(
        "Deposit Successful",
        `Successfully loaded KES ${amount} into your Captain Wallet. Ready for instant holds!`,
        "payment"
      );
    }
  }

  public static getNotifications(): MockNotification[] {
    return this.get<MockNotification[]>("notifications", INITIAL_NOTIFICATIONS);
  }

  public static addNotification(title: string, message: string, type: "booking" | "payment" | "system") {
    const notifs = this.getNotifications();
    const newNotif: MockNotification = {
      id: "n_" + Math.random().toString(36).substr(2, 9),
      title,
      message,
      type,
      date: new Date().toISOString(),
      read: false
    };
    notifs.unshift(newNotif);
    this.set("notifications", notifs);
  }

  public static markNotificationsRead() {
    const notifs = this.getNotifications().map(n => ({ ...n, read: true }));
    this.set("notifications", notifs);
  }

  // --- Admin Analytics Helpers ---

  public static getAdminAnalytics() {
    const venues = this.getVenues();
    const bookings = this.getBookings().filter(b => b.status === "CONFIRMED");
    const activeBookingsCount = bookings.length;
    const revenue = bookings.reduce((sum, b) => sum + b.price, 0) + 15500; // Base historical revenue
    const utilizationRate = Math.min(95, Math.floor(45 + activeBookingsCount * 8));

    return {
      revenue,
      bookingsCount: activeBookingsCount + 8,
      utilizationRate,
      activeUsers: 342,
      activeCoaches: this.getCoaches().length,
      venuesCount: venues.length
    };
  }
}
