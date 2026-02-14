import { useEffect, useState } from "react";
import AnalystDashboard from "./pages/AnalystDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import { authApi } from "./api/api";

const emptyAuthForm = {
  name: "",
  email: "",
  password: "",
  role: "аналитик",
};

function App() {
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [user, setUser] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(Boolean(token));
  const [mode, setMode] = useState("login");
  const [authForm, setAuthForm] = useState(emptyAuthForm);
  const [error, setError] = useState("");

  const parseError = (apiError) =>
    apiError?.response?.data?.message || apiError.message || "Неизвестная ошибка";

  useEffect(() => {
    async function loadProfile() {
      if (!token) {
        setUser(null);
        setLoadingProfile(false);
        return;
      }

      setLoadingProfile(true);
      try {
        const profileResponse = await authApi.me();
        setUser(profileResponse.data);
        setError("");
      } catch (apiError) {
        localStorage.removeItem("token");
        setToken("");
        setUser(null);
        setError(parseError(apiError));
      } finally {
        setLoadingProfile(false);
      }
    }

    loadProfile();
  }, [token]);

  const submitAuth = async (event) => {
    event.preventDefault();
    try {
      if (mode === "login") {
        const response = await authApi.login({
          email: authForm.email,
          password: authForm.password,
        });
        localStorage.setItem("token", response.data.token);
        setToken(response.data.token);
        setUser(response.data.user);
      } else {
        const response = await authApi.register(authForm);
        localStorage.setItem("token", response.data.token);
        setToken(response.data.token);
        setUser(response.data.user);
      }

      setAuthForm(emptyAuthForm);
      setError("");
    } catch (apiError) {
      setError(parseError(apiError));
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken("");
    setUser(null);
  };

  if (loadingProfile) {
    return <p style={{ padding: 20 }}>Загрузка профиля...</p>;
  }

  if (!token || !user) {
    return (
      <main style={styles.authPage}>
        <form onSubmit={submitAuth} style={styles.authForm}>
          <h1>Портал (Аналитик / Админ)</h1>
          <p>Авторизация по JWT</p>

          {mode === "register" ? (
            <>
              <input
                required
                placeholder="Имя"
                value={authForm.name}
                onChange={(event) => setAuthForm((prev) => ({ ...prev, name: event.target.value }))}
              />
              <select
                value={authForm.role}
                onChange={(event) => setAuthForm((prev) => ({ ...prev, role: event.target.value }))}
              >
                <option value="аналитик">аналитик</option>
                <option value="админ">админ</option>
              </select>
            </>
          ) : null}

          <input
            required
            type="email"
            placeholder="Email"
            value={authForm.email}
            onChange={(event) => setAuthForm((prev) => ({ ...prev, email: event.target.value }))}
          />
          <input
            required
            type="password"
            placeholder="Пароль"
            value={authForm.password}
            onChange={(event) => setAuthForm((prev) => ({ ...prev, password: event.target.value }))}
          />

          {error ? <div style={styles.error}>{error}</div> : null}

          <button type="submit">{mode === "login" ? "Войти" : "Зарегистрироваться"}</button>
          <button type="button" onClick={() => setMode((prev) => (prev === "login" ? "register" : "login"))}>
            {mode === "login" ? "Нет аккаунта? Регистрация" : "Есть аккаунт? Войти"}
          </button>
        </form>
      </main>
    );
  }

  if (user.role === "админ") {
    return <AdminDashboard user={user} onLogout={logout} />;
  }

  return <AnalystDashboard user={user} onLogout={logout} />;
}

const styles = {
  authPage: {
    minHeight: "100vh",
    display: "grid",
    placeItems: "center",
    background: "#f2f4fa",
    padding: 16,
  },
  authForm: {
    width: "100%",
    maxWidth: 420,
    background: "#fff",
    border: "1px solid #ddd",
    borderRadius: 8,
    padding: 18,
    display: "grid",
    gap: 10,
  },
  error: {
    color: "#900",
    background: "#ffeaea",
    border: "1px solid #f0b1b1",
    borderRadius: 6,
    padding: 10,
  },
};

export default App;
