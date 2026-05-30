import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import Splash from "./pages/Splash";
import Login from "./pages/Login";
import Register from "./pages/Register";
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
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
