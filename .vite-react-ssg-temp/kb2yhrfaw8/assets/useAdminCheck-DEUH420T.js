import { useState, useEffect } from "react";
import { s as supabase } from "../main.mjs";
import { useNavigate } from "react-router-dom";
function useAdminCheck() {
  const [isAdmin, setIsAdmin] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }
      const { data, error } = await supabase.rpc("has_role", {
        _user_id: user.id,
        _role: "admin"
      });
      if (error || !data) {
        navigate("/dashboard");
        return;
      }
      setIsAdmin(true);
      setIsLoading(false);
    };
    checkAdmin();
  }, [navigate]);
  return { isAdmin, isLoading };
}
export {
  useAdminCheck as u
};
