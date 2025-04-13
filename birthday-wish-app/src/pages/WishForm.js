import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';
import { motion } from 'framer-motion';
import { FaGift, FaHeart, FaBirthdayCake, FaPenAlt } from 'react-icons/fa';

const suggestedGifts = [
  "Chocolate (Name)",
  "Gadgets",
  "A Day Out",
  "A Sweet Note poetry",
  "Toy",
  "A Book (Name)",
  "Dress",
  "Surprise Me! 🎁"
];

const WishForm = () => {
  const { name } = useParams();
  const [wish, setWish] = useState('');
  const [gift, setGift] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [confirmMode, setConfirmMode] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isHovering, setIsHovering] = useState(false);

  const { width, height } = useWindowSize();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!confirmMode) {
      setConfirmMode(true);
      return;
    }

    try {
      await addDoc(collection(db, 'wishes'), {
        name: name || 'anonymous',
        wish,
        gift,
        createdAt: serverTimestamp(),
        gifted: false
      });
      setSubmitted(true);
    } catch (error) {
      console.error("Error saving wish:", error);
    }
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-100 via-purple-50 to-yellow-50 px-4 py-12">
      <motion.div 
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="w-full max-w-lg relative"
      >
        {/* Floating birthday cake decoration */}
        <motion.div
          animate={{
            y: [0, -10, 0],
            rotate: [0, 5, -5, 0]
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute -top-12 -right-8 text-4xl text-pink-400"
        >
          <FaBirthdayCake />
        </motion.div>

        <div className="bg-white shadow-2xl rounded-3xl p-8 relative border-4 border-pink-200 overflow-hidden">
          {/* Ribbon decoration */}
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-pink-400 via-purple-400 to-yellow-300"></div>
          
          {/* Header badge */}
          <motion.div 
            className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-pink-400 to-purple-500 text-white rounded-full px-6 py-2 text-xl font-bold shadow-lg z-10"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            🎂 Birthday Card
          </motion.div>

          {!submitted ? (
            <>
              <motion.h1 
                variants={itemVariants}
                className="text-4xl text-center font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-purple-600 mb-6"
              >
                Happy Birthday, {name}! 🎉
              </motion.h1>

              <motion.form 
                onSubmit={handleSubmit} 
                className="space-y-6"
                variants={containerVariants}
              >
                <motion.div variants={itemVariants}>
                  <label className="flex items-center text-lg font-semibold text-pink-800 mb-2">
                    <FaHeart className="mr-2 text-pink-500" />
                    Your Heartfelt Wish
                  </label>
                  <div className="relative">
                    <div className="absolute top-3 left-3 text-pink-400">
                      <FaPenAlt />
                    </div>
                    <textarea
                      className="w-full pl-10 p-4 border border-pink-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-transparent transition-all duration-300"
                      rows="4"
                      value={wish}
                      onChange={(e) => setWish(e.target.value)}
                      placeholder="Write your sweet message..."
                      required
                    />
                  </div>
                </motion.div>

                <motion.div variants={itemVariants}>
                  <label className="flex items-center text-lg font-semibold text-pink-800 mb-2">
                    <FaGift className="mr-2 text-yellow-500" />
                    Dream Gift (Budget-Friendly)
                  </label>
                  <div className="relative">
                    <div className="absolute top-3 left-3 text-yellow-400">
                      <FaGift />
                    </div>
                    <input
                      className="w-full pl-10 p-4 border border-yellow-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all duration-300"
                      value={gift}
                      onChange={(e) => setGift(e.target.value)}
                      placeholder="Text here | Only one time 😄"
                      required
                    />
                  </div>

                  <motion.button
                    type="button"
                    onClick={() => setShowSuggestions(!showSuggestions)}
                    className="mt-2 text-pink-600 hover:text-pink-800 transition-colors duration-300 flex items-center"
                    whileHover={{ x: 5 }}
                  >
                    <span className="underline">Not sure? Choose from suggestions!</span>
                    <motion.span
                      animate={{ rotate: showSuggestions ? 180 : 0 }}
                      className="ml-1"
                    >
                      ▼
                    </motion.span>
                  </motion.button>

                  {showSuggestions && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="grid grid-cols-2 gap-3 mt-4"
                    >
                      {suggestedGifts.map((item, idx) => (
                        <motion.button
                          type="button"
                          key={idx}
                          onClick={() => {
                            setGift(item);
                            setShowSuggestions(false);
                          }}
                          className="bg-gradient-to-br from-pink-50 to-yellow-50 border border-pink-200 rounded-xl px-4 py-3 text-sm hover:shadow-md transition-all"
                          whileHover={{ y: -2, scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          {item}
                        </motion.button>
                      ))}
                    </motion.div>
                  )}
                </motion.div>

                {confirmMode && (
                  <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center font-medium bg-pink-50 p-3 rounded-lg border border-pink-200"
                  >
                    💖 Please make sure your wish is within budget!
                  </motion.p>
                )}

                <motion.div variants={itemVariants}>
                  <motion.button
                    type="submit"
                    className={`w-full ${
                      confirmMode
                        ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:shadow-green-200'
                        : 'bg-gradient-to-r from-pink-500 via-purple-500 to-yellow-500 hover:shadow-pink-200'
                    } text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-300 relative overflow-hidden`}
                    whileHover={{ 
                      scale: 1.02,
                      boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)"
                    }}
                    whileTap={{ scale: 0.98 }}
                    onHoverStart={() => setIsHovering(true)}
                    onHoverEnd={() => setIsHovering(false)}
                  >
                    {isHovering && (
                      <motion.span 
                        className="absolute -top-1 -left-1 w-3 h-3 rounded-full bg-white opacity-50"
                        animate={{
                          x: [0, 300],
                          y: [0, 150],
                          opacity: [0.5, 0]
                        }}
                        transition={{
                          duration: 1.5,
                          repeat: Infinity
                        }}
                      />
                    )}
                    {confirmMode ? (
                      <>🎉 Yes, Send My Wish!</>
                    ) : (
                      <>✨ Submit My Wish</>
                    )}
                  </motion.button>
                </motion.div>
              </motion.form>
            </>
          ) : (
            <motion.div 
              className="text-center py-8"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <Confetti width={width} height={height} />
              <div className="text-6xl mb-4">🎊</div>
              <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-purple-600">
                Thank You!
              </h2>
              <p className="mt-4 text-lg text-gray-700">
                Your wish has been sent to {name}! 🌟
              </p>
              <motion.div
                animate={{ 
                  scale: [1, 1.1, 1],
                  rotate: [0, 5, -5, 0]
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity 
                }}
                className="text-4xl mt-6"
              >
                🎁
              </motion.div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default WishForm;