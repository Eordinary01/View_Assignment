import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import Navbar from "../components/Navbar";
import { motion, AnimatePresence } from "framer-motion";
import { FiUpload, FiDownload, FiFilter, FiX, FiEye, FiBook, FiCalendar, FiUser, FiChevronDown, FiArrowUp } from "react-icons/fi";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate } from "react-router-dom";

const Home = () => {
  const [formData, setFormData] = useState({ course: "", branch: "", year: "", subject: "", file: null });
  const [assignments, setAssignments] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [filters, setFilters] = useState({ course: "", branch: "", year: "", subject: "" });
  const [showForm, setShowForm] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [sortBy, setSortBy] = useState("date");
  const [sortOrder, setSortOrder] = useState("desc");
  const [filterOptions, setFilterOptions] = useState({ courses: [], branches: [], years: [], subjects: [] });
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchAssignments();
  }, []);

  useEffect(() => {
    updateFilterOptions();
  }, [assignments]);

  const checkTokenExpiration = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("You are not authenticated. Please log in.");
      navigate("/login");
      return false;
    }

    try {
      await axios.get("http://127.0.0.1:8007/auth/check-token", {
        headers: { Authorization: `Bearer ${token}` },
      });
      return true;
    } catch (err) {
      if (err.response && err.response.status === 401) {
        toast.error("Your session has expired. Please log in again.");
        localStorage.removeItem("token");
        navigate("/login");
      } else {
        toast.error("An error occurred. Please try again.");
      }
      return false;
    }
  }, [navigate]);

  const fetchAssignments = async () => {
    setIsLoading(true);
    if (await checkTokenExpiration()) {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get("http://127.0.0.1:8007/assignments/assignments", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setAssignments(res.data);
      } catch (err) {
        toast.error("Failed to fetch assignments");
        console.error(err);
      }
    }
    setIsLoading(false);
  };

  const updateFilterOptions = () => {
    const options = {
      courses: [...new Set(assignments.map((a) => a.course))],
      branches: [...new Set(assignments.map((a) => a.branch))],
      years: [...new Set(assignments.map((a) => a.year))],
      subjects: [...new Set(assignments.map((a) => a.subject))],
    };
    setFilterOptions(options);
  };

  const handleInputChange = (e) => {
    const { name, value, files } = e.target;
    setFormData((prev) => ({ ...prev, [name]: files ? files[0] : value }));
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    setIsUploading(true);
    const formDataToSend = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      formDataToSend.append(key, value);
    });

    if (await checkTokenExpiration()) {
      try {
        const token = localStorage.getItem("token");
        await axios.post("http://127.0.0.1:8007/assignments/upload", formDataToSend, {
          headers: { Authorization: `Bearer ${token}` },
        });
        fetchAssignments();
        setShowForm(false);
        setFormData({ course: "", branch: "", year: "", subject: "", file: null });
        toast.success("Assignment uploaded successfully");
      } catch (err) {
        toast.error("Failed to upload assignment");
        console.error(err);
      } finally {
        setIsUploading(false);
      }
    }
  };

  const filteredAndSortedAssignments = assignments
    .filter((assignment) =>
      (!filters.course || assignment.course === filters.course) &&
      (!filters.branch || assignment.branch === filters.branch) &&
      (!filters.year || assignment.year === filters.year) &&
      (!filters.subject || assignment.subject === filters.subject)
    )
    .sort((a, b) => {
      if (sortBy === "date") {
        return sortOrder === "asc"
          ? new Date(a.createdAt) - new Date(b.createdAt)
          : new Date(b.createdAt) - new Date(a.createdAt);
      }
      return sortOrder === "asc"
        ? a[sortBy].localeCompare(b[sortBy])
        : b[sortBy].localeCompare(a[sortBy]);
    });

  const handleDownload = async (assignment) => {
    if (await checkTokenExpiration()) {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(
          `http://127.0.0.1:8007/assignments/uploads/${assignment.fileUrl.split("/").pop()}`,
          {
            headers: { Authorization: `Bearer ${token}` },
            responseType: "blob",
          }
        );

        const contentDisposition = response.headers["content-disposition"];
        let filename = `${assignment.subject}_assignment`;
        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename="?(.+)"?/i);
          if (filenameMatch && filenameMatch.length === 2) {
            filename = filenameMatch[1];
          }
        }

        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", filename);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      } catch (err) {
        toast.error("Failed to download file");
        console.error("Download error:", err);
      }
    }
  };

  const handleLogout = useCallback(() => {
    localStorage.removeItem("token");
    toast.success("Logged out successfully");
    navigate("/login");
  }, [navigate]);

  const toggleSort = (field) => {
    setSortBy(field);
    setSortOrder((prev) => prev === "asc" ? "desc" : "asc");
  };

  const FilterDropdown = ({ name, options }) => (
    <div className="relative">
      <select
        name={name}
        value={filters[name]}
        onChange={handleFilterChange}
        className="w-full p-3 border rounded-lg appearance-none bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-300"
      >
        <option value="">All {name}s</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      <FiChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
    </div>
  );

  return (
    <div className="bg-gray-100 min-h-screen">
      <Navbar onLogout={handleLogout} />
      <div className="container mx-auto p-4">
        <ToastContainer />

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8 flex justify-between items-center"
        >
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-500 text-white px-8 py-4 rounded-full shadow-lg hover:bg-blue-600 transition duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
          >
            {showForm ? "Hide Upload Form" : "Upload New Assignment"}
          </button>
        </motion.div>

        <AnimatePresence>
          {showForm && (
            <motion.form
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-white p-8 rounded-lg shadow-xl mb-8"
              onSubmit={handleUpload}
            >
              <h2 className="text-2xl font-bold mb-6 text-blue-600">Upload Assignment</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {["course", "branch", "year", "subject"].map((field) => (
                  <div key={field} className="relative">
                    <input
                      type="text"
                      name={field}
                      placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
                      value={formData[field]}
                      onChange={handleInputChange}
                      className="w-full p-4 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-300 pl-12"
                    />
                    <span className="absolute left-3 top-4 text-gray-400">
                      {field === "course" && <FiBook />}
                      {field === "branch" && <FiUser />}
                      {field === "year" && <FiCalendar />}
                      {field === "subject" && <FiBook />}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mb-6">
                <label className="block mb-2 font-semibold text-gray-700">Upload File</label>
                <input
                  type="file"
                  name="file"
                  onChange={handleInputChange}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>
              <motion.button
                type="submit"
                disabled={isUploading}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-full bg-green-500 text-white p-4 rounded-lg hover:bg-green-600 transition duration-300 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50"
              >
                {isUploading ? "Uploading..." : (<><FiUpload className="mr-2" /> Upload Assignment</>)}
              </motion.button>
            </motion.form>
          )}
        </AnimatePresence>

        <div className="mb-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <FilterDropdown name="course" options={filterOptions.courses} />
          <FilterDropdown name="branch" options={filterOptions.branches} />
          <FilterDropdown name="year" options={filterOptions.years} />
          <FilterDropdown name="subject" options={filterOptions.subjects} />
        </div>
        <div className="mb-6 flex justify-end space-x-4">
          <button
            onClick={() => toggleSort("subject")}
            className="text-blue-600 hover:text-blue-800 transition duration-300"
          >
            Sort by Subject {sortBy === "subject" && (sortOrder === "asc" ? "↑" : "↓")}
          </button>
          <button
            onClick={() => toggleSort("date")}
            className="text-blue-600 hover:text-blue-800 transition duration-300"
          >
            Sort by Date {sortBy === "date" && (sortOrder === "asc" ? "↑" : "↓")}
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {filteredAndSortedAssignments.map((assignment) => (
              <motion.div
                key={assignment._id}
                whileHover={{ scale: 1.03, boxShadow: "0 10px 20px rgba(0,0,0,0.1)" }}
                whileTap={{ scale: 0.98 }}
                className="bg-white p-6 rounded-lg shadow-md transition duration-300"
              >
                <h3 className="font-bold text-xl mb-3 text-blue-600">{assignment.subject}</h3>
                <p className="text-sm text-gray-600 mb-4">{`${assignment.course} - ${assignment.branch} - ${assignment.year}`}</p>
                <p className="text-xs text-gray-500 mb-4">{new Date(assignment.createdAt).toLocaleDateString()}</p>
                <div className="flex justify-between">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleDownload(assignment)}
                    className="inline-flex items-center text-green-500 hover:text-green-600 transition duration-300"
                  >
                    <FiDownload className="mr-1" /> Download
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setSelectedAssignment(assignment)}
                    className="inline-flex items-center text-blue-500 hover:text-blue-600 transition duration-300"
                  >
                    <FiEye className="mr-1" /> View Details
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        <AnimatePresence>
          {selectedAssignment && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            >
              <motion.div
                initial={{ y: -50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 50, opacity: 0 }}
                className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-2xl w-full max-w-lg relative"
              >
                <button
                  onClick={() => setSelectedAssignment(null)}
                  className="absolute top-4 right-4 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 transition duration-300"
                >
                  <FiX size={24} />
                </button>
                <h2 className="text-3xl font-bold mb-6 text-blue-600 dark:text-blue-400">
                  {selectedAssignment.subject}
                </h2>
                <div className="mb-6 space-y-3 text-gray-700 dark:text-gray-300">
                  <p className="flex items-center">
                    <FiBook className="mr-2" /> Course:{" "}
                    {selectedAssignment.course}
                  </p>
                  <p className="flex items-center">
                    <FiUser className="mr-2" /> Branch:{" "}
                    {selectedAssignment.branch}
                  </p>
                  <p className="flex items-center">
                    <FiCalendar className="mr-2" /> Year:{" "}
                    {selectedAssignment.year}
                  </p>
                  <p className="flex items-center">
                    <FiCalendar className="mr-2" /> Uploaded By:{" "}
                    {selectedAssignment.uploadedBy.email}
                  </p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleDownload(selectedAssignment)}
                  className="bg-green-500 text-white p-4 rounded-lg hover:bg-green-600 transition duration-300 w-full flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50"
                >
                  <FiDownload className="mr-2" /> Download Assignment
                </motion.button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <ScrollToTopButton />
      </div>
    </div>
  );
};

const ScrollToTopButton = () => {
  const [isVisible, setIsVisible] = useState(false);

  const toggleVisibility = () => {
    if (window.pageYOffset > 300) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  useEffect(() => {
    window.addEventListener("scroll", toggleVisibility);
    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 bg-blue-500 text-white p-3 rounded-full shadow-lg hover:bg-blue-600 transition duration-300"
        >
          <FiArrowUp />
        </motion.button>
      )}
    </AnimatePresence>
  );
};

export default Home;
