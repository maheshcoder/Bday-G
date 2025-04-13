import React, { useEffect, useState } from 'react';
import { auth, db } from '../firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, orderBy, query, updateDoc, doc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { FiLogOut, FiGift, FiCheckCircle, FiRefreshCw, FiUser } from 'react-icons/fi';
import { FaBirthdayCake, FaRegSmileWink } from 'react-icons/fa';

const Admin = () => {
  const navigate = useNavigate();
  const [wishes, setWishes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userEmail, setUserEmail] = useState('');

  // 🔐 Auth Guard
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        navigate('/login');
      } else {
        setUserEmail(user.email);
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  // 🎁 Fetch Wishes
  const fetchWishes = async () => {
    setRefreshing(true);
    try {
      const q = query(collection(db, 'wishes'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      setWishes(
        snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
      );
    } catch (err) {
      console.error("Error fetching wishes:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchWishes();
  }, []);

  // ✅ Mark as Completed
  const markCompleted = async (id) => {
    try {
      const ref = doc(db, 'wishes', id);
      await updateDoc(ref, {
        completed: true,
        completedAt: new Date()
      });
      fetchWishes(); // Refresh list
    } catch (error) {
      console.error("Error updating wish:", error);
    }
  };

  // 🚪 Logout
  const handleLogout = async () => {
    await signOut(auth);
    navigate('/login');
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-yellow-50 p-4 md:p-8">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4"
      >
        <div className="flex items-center gap-3">
          <motion.div 
            animate={{ 
              rotate: [0, 10, -10, 0],
              scale: [1, 1.1, 1]
            }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              repeatDelay: 3
            }}
            className="text-4xl text-pink-500"
          >
            <FaBirthdayCake />
          </motion.div>
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
            Birthday Wishes Dashboard
          </h1>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-full shadow-sm">
            <FiUser className="text-purple-500" />
            <span className="text-sm font-medium text-gray-700">{userEmail}</span>
          </div>
          
          <motion.button
            onClick={handleLogout}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-full hover:shadow-lg transition-all"
          >
            <FiLogOut />
            <span>Logout</span>
          </motion.button>
        </div>
      </motion.div>

      {/* Stats Bar */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8"
      >
        <div className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-pink-400">
          <h3 className="text-gray-500 text-sm font-medium">Total Wishes</h3>
          <p className="text-3xl font-bold text-pink-600">{wishes.length}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-yellow-400">
          <h3 className="text-gray-500 text-sm font-medium">Pending</h3>
          <p className="text-3xl font-bold text-yellow-600">
            {wishes.filter(w => !w.completed).length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-green-400">
          <h3 className="text-gray-500 text-sm font-medium">Completed</h3>
          <p className="text-3xl font-bold text-green-600">
            {wishes.filter(w => w.completed).length}
          </p>
        </div>
      </motion.div>

      {/* Refresh Button */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="flex justify-end mb-4"
      >
        <motion.button
          onClick={fetchWishes}
          disabled={refreshing}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          className="flex items-center gap-2 px-4 py-2 bg-white text-purple-600 rounded-full hover:bg-purple-50 transition-all shadow-sm"
        >
          {refreshing ? (
            <>
              <FiRefreshCw className="animate-spin" />
              <span>Refreshing...</span>
            </>
          ) : (
            <>
              <FiRefreshCw />
              <span>Refresh Wishes</span>
            </>
          )}
        </motion.button>
      </motion.div>

      {/* Wishes List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="text-4xl text-pink-500 mb-4"
          >
            <FiGift />
          </motion.div>
          <p className="text-gray-600">Loading birthday wishes... 🎈</p>
        </div>
      ) : wishes.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-12 bg-white rounded-xl shadow-sm"
        >
          <motion.div
            animate={{ 
              scale: [1, 1.1, 1],
              rotate: [0, 10, -10, 0]
            }}
            transition={{ 
              duration: 3,
              repeat: Infinity 
            }}
            className="text-6xl text-yellow-400 mb-4"
          >
            <FaRegSmileWink />
          </motion.div>
          <h3 className="text-xl font-medium text-gray-700 mb-2">No wishes yet</h3>
          <p className="text-gray-500 max-w-md text-center">
            Waiting for party guests to submit their wishes! Check back later or refresh the page.
          </p>
        </motion.div>
      ) : (
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
        >
          <AnimatePresence>
            {wishes.map((wish) => (
              <motion.div
                key={wish.id}
                variants={itemVariants}
                layout
                className={`bg-white p-5 rounded-xl shadow-md hover:shadow-lg transition-shadow ${
                  wish.completed ? 'border-l-4 border-green-500' : 'border-l-4 border-pink-500'
                }`}
              >
                <div className="flex justify-between items-start mb-3">
                  <h2 className="text-xl font-semibold flex items-center gap-2">
                    <span className="text-pink-500">🎈</span>
                    <span className="bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                      {wish.name}
                    </span>
                  </h2>
                  {wish.completed && (
                    <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full flex items-center gap-1">
                      <FiCheckCircle />
                      <span>Completed</span>
                    </span>
                  )}
                </div>

                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-500 font-medium">Wish:</p>
                    <p className="text-gray-700 bg-pink-50 p-3 rounded-lg">{wish.wish}</p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500 font-medium">Gift Idea:</p>
                    <p className="text-gray-700 bg-yellow-50 p-3 rounded-lg">{wish.gift}</p>
                  </div>

                  {wish.completedAt && (
                    <div>
                      <p className="text-sm text-gray-500 font-medium">Completed on:</p>
                      <p className="text-gray-700 text-sm">
                        {new Date(wish.completedAt.seconds * 1000).toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>

                {!wish.completed && (
                  <motion.button
                    onClick={() => markCompleted(wish.id)}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className="mt-4 w-full py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg flex items-center justify-center gap-2 hover:shadow-md transition-all"
                  >
                    <FiCheckCircle />
                    <span>Mark as Completed</span>
                  </motion.button>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
};

export default Admin;