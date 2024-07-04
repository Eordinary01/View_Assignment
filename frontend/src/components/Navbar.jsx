import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { FiUpload, FiDownload, FiFilter, FiX, FiEye, FiLogOut, FiMenu } from 'react-icons/fi';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Navbar Component
const Navbar = ({ onLogout }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="bg-blue-600 text-white p-4">
      <div className="container mx-auto flex justify-between items-center">
        <motion.h1 
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-2xl font-bold"
        >
          Assignment Dashboard
        </motion.h1>
        <div className="hidden md:flex space-x-4">
          <button onClick={onLogout} className="flex items-center hover:text-blue-200 transition duration-300">
            <FiLogOut className="mr-2" /> Logout
          </button>
        </div>
        <div className="md:hidden">
          <button onClick={() => setIsOpen(!isOpen)} className="focus:outline-none">
            <FiMenu size={24} />
          </button>
        </div>
      </div>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden mt-4"
          >
            <button onClick={onLogout} className="block w-full text-left py-2 hover:bg-blue-700 transition duration-300">
              <FiLogOut className="inline mr-2" /> Logout
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;