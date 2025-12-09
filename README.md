
# KIN: Your Digital Living Room

<p align="center">
  <img src="https://fra.cloud.appwrite.io/v1/storage/buckets/6912847200215b418d6d/files/6936030b0018676b0edd/view?project=69127eb7001c1e85b1aa" alt="KIN Logo" width="200"/>
</p>

<p align="center">
  <strong>Hyper-Private Social Connections</strong>
  <br />
  <em>No ads. No noise. Just memories.</em>
</p>

KIN is a modern, mobile-first social application designed for creating intimate digital spaces with close friends. It replaces the noise of mainstream social media with a focused, real-time chat and a shared "Memory Wall" for your inner circle.

Built with performance and privacy in mind, KIN provides a seamless and beautiful experience for fostering deep connections.

---

## ✨ Key Features

-   **🔒 Hyper-Private Spaces:** Create private groups ("Circles") for your closest friends. No algorithms, no ads.
-   **💬 Real-Time Chat:** A powerful, modern chat interface with support for text, images, and reactions. Built on Supabase for instant message delivery.
-   **📸 Shared Memory Wall:** A visual timeline for your Circle to share and relive memories together.
-   **🤝 Smart Social Hub:** A single, elegant screen to manage friend requests, discover new connections, and view your circle.
-   **🔔 Thoughtful Notifications:** A clean, contextual notification system that keeps you updated without being overwhelming.
-   **🎨 Modern UI/UX:** A stunning, dark-themed interface built with React Native and NativeWind, inspired by the best modern apps.

---

## 🛠 Tech Stack

KIN is built with a modern, powerful, and scalable stack.

-   **Frontend:** [React Native](https://reactnative.dev/) with [Expo](https://expo.dev/)
-   **Navigation:** [Expo Router](https://docs.expo.dev/router/) for file-based routing
-   **Styling:** [NativeWind (Tailwind CSS)](https://www.nativewind.dev/) for rapid, consistent UI development
-   **Backend:** [Supabase](https://supabase.com/) for Authentication, Real-time Database, and Storage
-   **State Management:** [TanStack Query (React Query)](https://tanstack.com/query/latest) for powerful server state management and caching
-   **Forms:** [React Hook Form](https://react-hook-form.com/) with [Zod](https://zod.dev/) for robust, validated forms
-   **Icons:** [Lucide React Native](https://lucide.dev/) for beautiful, consistent icons

---

## 🚀 Getting Started

To get a local copy of KIN up and running, follow these steps.

### Prerequisites

-   [Node.js](https://nodejs.org/) (v18 or newer)
-   [Bun](https://bun.sh/) (recommended package manager) or `npm`
-   Physical iOS/Android device or an emulator/simulator for testing.

### 1. Clone and Install Dependencies

```bash
# Clone the repository
git clone https://github.com/HAKIMTABAKH/KIN
cd kin

# Install dependencies
bun install
```

### 2. Set Up Supabase

1.  Create a new project at [supabase.com](https://supabase.com).
2.  Run the provided SQL schema in the Supabase SQL editor to set up your database tables (`profiles`, `friendships`, `messages`, etc.).
3.  Find your API URL and `anon` key in Supabase Settings > API.
4.  Create a `.env.local` file in the root of the project and add your keys:

    ```env
    EXPO_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_URL
    EXPO_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
    ```

### 3. Start the Development Server

```bash
bun start
```

This will start the Metro bundler and open the Expo development server in your browser. You can now run the app on:

-   **Physical Device:** Download the [Expo Go](https://expo.dev/go) app and scan the QR code.
-   **Simulator/Emulator:** Press `i` to open the iOS Simulator or `a` to open an Android Emulator.

---

## 📱 Project Structure

The project uses a file-based routing system, making navigation intuitive.

```
KIN/
├── app/                  # Main application screens & routing
│   ├── (auth)/           # Authentication screens (sign-in, sign-up)
│   ├── (tabs)/           # Bottom tab navigation screens
│   │   ├── feed.jsx
│   │   ├── social-hub.jsx
│   │   └── profile.jsx
│   ├── [chatRoom].jsx     # Dynamic chat room screen
│   └── _layout.tsx        # Root layout and providers
├── components/            # Reusable UI components
│   ├── CustomInput.jsx
│   ├── MessageMenu.jsx
│   └── ProfileTabIcon.tsx
├── constants/             # App-wide constants (colors, images, etc.)
├── context/               # React Context for global state
│   └── UserContext.tsx
├── lib/                  # Utility functions (supabase client, auth, etc.)
├── types/                 # TypeScript type definitions
└── assets/               # Static assets (images, fonts)
```

---

## 🤝 Contributing

We welcome contributions! If you'd like to help improve KIN, please:

1.  Fork the repository.
2.  Create a new branch for your feature (`git checkout -b feature/AmazingFeature`).
3.  Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4.  Push to the branch (`git push origin feature/AmazingFeature`).
5.  Open a Pull Request.

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 📧 Contact

Your Name - [@your-twitter](https://twitter.com/your-twitter) - your.hakim.tabakh@isimg.tn

Project Link: [https://github.com/HAKIMTABAKH](https://github.com/HAKIMTABAKH/KIN)
```

### Why this README is better for your project:

*   **It tells a story:** It immediately establishes the "why" behind KIN.
*   **Highlights Features:** Users and developers can see the core functionality at a glance.
*   **Details the Tech Stack:** This is incredibly useful for other developers and shows you're using modern tools.
*   **Provides Clear Instructions:** The setup steps are specific to your app's needs (e.g., Supabase configuration).
*   **Shows Project Structure:** This helps new contributors understand the codebase quickly.
*   **Looks Professional:** The use of badges, emojis, and clear sections makes it easy and pleasant to read.