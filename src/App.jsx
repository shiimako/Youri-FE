import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import Splash from "./pages/Splash";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/profile/Profile";
import SpriteKatalog from "./pages/profile/SpriteKatalog";
import MainLayout from "./layouts/MainLayouts";
import RecipeDetail from "./pages/cooking/RecipeDetail";
import WeeklyHistory from "./pages/WeeklyHistory";
import MyRecipes from "./pages/recipes/MyRecipes";
import CreateRecipe from "./pages/recipes/CreateRecipe";
import EditRecipe from "./pages/recipes/EditRecipe";
import InputSubstituteIngredients from "./pages/cooking/InputSubtituteIngredients";
import MatchRecipe from "./pages/cooking/MatchRecipe";
import Notifications from "./pages/Notifications";
import AdminPortal from "./pages/admin/AdminPortal";
import AdminReports from "./pages/admin/AdminReports"; 
import AdminSprites from "./pages/admin/AdminSprites";
import AdminSpriteDetail from "./pages/admin/AdminSpriteDetail";


function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-center"
        toastOptions={{
          style: { borderRadius: "10px", background: "#333", color: "#fff" },
        }}
      />
      <Routes>
        <Route path="/" element={<Splash />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route element={<MainLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/profile/sprites" element={<SpriteKatalog />} />
          <Route path="/weekly-history" element={<WeeklyHistory />} />
          <Route path="/cooking/start" element={<MatchRecipe />} />
          <Route path="/cooking/recipe/:id" element={<RecipeDetail />} />
          <Route path="/cooking/recipe/:id/compare" element={<InputSubstituteIngredients />} />
          <Route path="/my-recipes" element={<MyRecipes />} />
          <Route path="/my-recipes/create" element={<CreateRecipe />} />
          <Route path="/my-recipes/edit/:id" element={<EditRecipe />} />
          <Route path="/notifications" element={<Notifications />} /> 
          <Route path="/admin" element={<AdminPortal />} />
          <Route path="/admin/reports" element={<AdminReports />} />
          <Route path="/admin/sprites" element={<AdminSprites />} />
          <Route path="/admin/sprites/:package_id" element={<AdminSpriteDetail />} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
