import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { Toaster } from 'sonner';
import { ProtectedRoute } from './components/ProtectedRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Explore from './pages/Explore';
import Contribute from './pages/Contribute';
import PublishProject from './pages/PublishProject';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import BlogEditor from './pages/BlogEditor';
import BlogPost from './pages/BlogPost';
import BlogExplore from './pages/BlogExplore';
import BlogManagement from './pages/BlogManagement';
import ProjectDetail from './pages/ProjectDetail';
import ProjectDiscussion from './pages/ProjectDiscussion';


function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
          <BrowserRouter>
            <div className="App min-h-screen bg-background text-foreground transition-colors duration-300">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/explore" element={<Explore />} />
                <Route path="/contribute" element={<Contribute />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/reset-password/:token" element={<ResetPassword />} />
                <Route path="/profile/:username" element={<Profile />} />
                <Route path="/blogs" element={<Navigate to="/explore" replace />} />
                <Route path="/blog/:slug" element={<BlogPost />} />
                <Route path="/project/:projectId" element={<ProjectDetail />} />
                <Route path="/project/:projectId/discussion" element={<ProjectDiscussion />} />
                <Route
                  path="/blog/new"
                  element={
                    <ProtectedRoute>
                      <BlogEditor />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/blog/edit/:blogId"
                  element={
                    <ProtectedRoute>
                      <BlogEditor />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/blogs"
                  element={
                    <ProtectedRoute>
                      <BlogManagement />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/publish"
                  element={
                    <ProtectedRoute>
                      <PublishProject />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/publish/:projectId"
                  element={
                    <ProtectedRoute>
                      <PublishProject />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/settings"
                  element={
                    <ProtectedRoute>
                      <Settings />
                    </ProtectedRoute>
                  }
                />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
              <Toaster
                position="top-right"
                richColors
              />
            </div>
          </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
