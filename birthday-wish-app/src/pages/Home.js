import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Confetti from 'react-confetti';

const Home = () => {
  const [name, setName] = useState('');
  const [generatedLink, setGeneratedLink] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const navigate = useNavigate();

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
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

  const generateLink = (e) => {
    e.preventDefault();
    setIsGenerating(true);
    
    // Simulate processing delay for better UX
    setTimeout(() => {
      const cleanedName = name.trim().toLowerCase().replace(/\s+/g, '-');
      const link = `${window.location.origin}/wish/${cleanedName}`;
      setGeneratedLink(link);
      setIsGenerating(false);
      setShowConfetti(true);
    }, 800);
  };

  const copyLink = () => {
    navigator.clipboard.writeText(generatedLink);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  useEffect(() => {
    if (showConfetti) {
      const timer = setTimeout(() => setShowConfetti(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [showConfetti]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 via-yellow-100 to-purple-100 flex flex-col items-center font-sans overflow-x-hidden">
      {showConfetti && (
        <Confetti
          width={window.innerWidth}
          height={window.innerHeight}
          recycle={false}
          numberOfPieces={300}
          gravity={0.2}
        />
      )}

      {/* Hero Section */}
      <motion.div 
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="w-full text-center py-12 bg-gradient-to-r from-purple-400 via-pink-300 to-yellow-200 shadow-inner"
      >
        <motion.h1 
          variants={itemVariants}
          className="text-5xl md:text-6xl font-extrabold text-purple-800 mb-4 drop-shadow-lg"
        >
          � Surprise Gift Wisher
        </motion.h1>
        
        <motion.p 
          variants={itemVariants}
          className="text-lg md:text-xl text-gray-800 mb-6"
        >
          Secretly collect their dream gift & surprise them like a birthday ninja 🥷🎁
        </motion.p>
        
        <motion.div variants={itemVariants}>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/login')}
            className="bg-purple-600 hover:bg-purple-800 text-white px-6 py-3 rounded-full shadow-lg transition"
          >
            🔐 Admin Login
          </motion.button>
        </motion.div>

        <motion.div 
          variants={itemVariants}
          className="mt-8"
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 400, damping: 10 }}
        >
          <img
            src="https://images.unsplash.com/photo-1606761568499-b9b6ba4c3f6e?auto=format&fit=crop&w=800&q=80"
            alt="Birthday party"
            className="rounded-3xl shadow-lg w-96 mx-auto"
          />
        </motion.div>
      </motion.div>

      {/* Form Section */}
      <motion.div 
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="w-full max-w-lg bg-white rounded-2xl shadow-2xl p-8 mt-10 mx-4"
      >
        <h2 className="text-3xl font-bold text-center text-pink-600 mb-4">
          <span className="inline-block animate-bounce">🎈</span> Generate Birthday Wish Link
        </h2>

        <form onSubmit={generateLink}>
          <label className="block text-lg font-medium text-gray-700 mb-2">
            Enter Birthday Person's Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full p-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-pink-400 transition"
            placeholder="e.g. Mahesh, Mike..."
          />

          <motion.button
            type="submit"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            disabled={isGenerating}
            className={`mt-4 w-full ${isGenerating ? 'bg-pink-400' : 'bg-pink-500'} text-white py-3 rounded-xl hover:bg-pink-600 transition-all text-lg font-semibold flex items-center justify-center`}
          >
            {isGenerating ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Generating...
              </>
            ) : (
              '🚀 Generate Link'
            )}
          </motion.button>
        </form>

        {generatedLink && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-6 text-center bg-pink-100 p-4 rounded-xl shadow-md"
          >
            <p className="text-lg font-semibold text-purple-700 mb-2">🎁 Share this link:</p>
            <div className="relative">
              <p className="text-blue-600 break-words text-sm bg-white p-2 rounded-lg">
                {generatedLink}
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={copyLink}
                className={`mt-3 px-4 py-2 ${isCopied ? 'bg-green-500' : 'bg-purple-600'} text-white rounded-lg transition flex items-center mx-auto`}
              >
                {isCopied ? '✅ Copied!' : '📋 Copy Link'}
              </motion.button>
            </div>
          </motion.div>
        )}
      </motion.div>

      <motion.footer 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="mt-16 text-center text-sm text-gray-500"
      >
        Made with ❤️ for secret birthday surprises 🎉
      </motion.footer>
    </div>
  );
};

export default Home;