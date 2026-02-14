import { useEffect, useMemo, useState } from "react";
import { adminApi } from "../api/api";
import TemplateForm from "../components/TemplateForm";
import RuleTable from "../components/RuleTable";
import SchemaViewer from "../components/SchemaViewer";

/**
 * Личный кабинет администратора.
 * Содержит 3 вкладки:
 *  - Системы: CRUD систем (templates),
 *  - Роли: CRUD пользователей и их ролей,
 *  - Правила: CRUD бизнес-правил с выбором системы и роли.
 */
const tabs = [
  { id: "systems", label: "Системы" },
  { id: "roles", label: "Роли" },
  { id: "rules", label: "Правила" },
];

const emptyRoleForm = {
  name: "",
  email: "",
  password: "",
  role: "аналитик",
};

function AdminDashboard({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState("systems");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [systems, setSystems] = useState([]);
  const [roles, setRoles] = useState([]);
  const [rules, setRules] = useState([]);

  const [selectedSystemId, setSelectedSystemId] = useState(null);
  const [editingSystem, setEditingSystem] = useState(null);

  const [roleForm, setRoleForm] = useState(emptyRoleForm);
  const [editingRoleId, setEditingRoleId] = useState(null);

  const parseError = (apiError) =>
    apiError?.response?.data?.message || apiError.message || "Неизвестная ошибка";

  const selectedSystem = useMemo(
    () => systems.find((item) => item.id === selectedSystemId) || null,
    [systems, selectedSystemId]
  );

  const loadData = async () => {
    setLoading(true);
    try {
      const [systemsResponse, rolesResponse, rulesResponse] = await Promise.all([
        adminApi.listTemplates(),
        adminApi.listUsers(),
        adminApi.listRules(),
      ]);

      const nextSystems = systemsResponse.data || [];
      setSystems(nextSystems);
      setRoles(rolesResponse.data || []);
      setRules(rulesResponse.data || []);

      if (nextSystems.length && !selectedSystemId) {
        setSelectedSystemId(nextSystems[0].id);
      }

      setError("");
    } catch (apiError) {
      setError(parseError(apiError));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const notify = (text) => {
    setMessage(text);
    setTimeout(() => setMessage(""), 2200);
  };

  // --- Системы (templates) ---
  const createSystem = async (payload) => {
    try {
      await adminApi.createTemplate(payload);
      notify("Система добавлена");
      await loadData();
    } catch (apiError) {
      setError(parseError(apiError));
    }
  };

  const updateSystem = async (payload) => {
    if (!editingSystem) {
      return;
    }
    try {
      await adminApi.updateTemplate(editingSystem.id, payload);
      setEditingSystem(null);
      notify("Система обновлена");
      await loadData();
    } catch (apiError) {
      setError(parseError(apiError));
    }
  };

  const removeSystem = async (id) => {
    if (!window.confirm("Удалить систему?")) {
      return;
    }
    try {
      await adminApi.deleteTemplate(id);
      if (selectedSystemId === id) {
        setSelectedSystemId(null);
      }
      notify("Система удалена");
      await loadData();
    } catch (apiError) {
      setError(parseError(apiError));
    }
  };

  // --- Роли (users) ---
  const submitRole = async (event) => {
    event.preventDefault();
    try {
      if (editingRoleId) {
        const payload = {
          name: roleForm.name.trim(),
          email: roleForm.email.trim(),
          role: roleForm.role,
        };
        if (roleForm.password.trim()) {
          payload.password = roleForm.password;
        }
        await adminApi.updateUser(editingRoleId, payload);
        notify("Роль/пользователь обновлены");
      } else {
        await adminApi.createUser({
          name: roleForm.name.trim(),
          email: roleForm.email.trim(),
          password: roleForm.password,
          role: roleForm.role,
        });
        notify("Роль/пользователь добавлены");
      }

      setRoleForm(emptyRoleForm);
      setEditingRoleId(null);
      await loadData();
    } catch (apiError) {
      setError(parseError(apiError));
    }
  };

  const startEditRole = (target) => {
    setEditingRoleId(target.id);
    setRoleForm({
      name: target.name || "",
      email: target.email || "",
      password: "",
      role: target.role || "аналитик",
    });
  };

  const removeRole = async (id) => {
    if (!window.confirm("Удалить роль/пользователя?")) {
      return;
    }
    try {
      await adminApi.deleteUser(id);
      notify("Роль/пользователь удалены");
      await loadData();
    } catch (apiError) {
      setError(parseError(apiError));
    }
  };

  // --- Правила ---
  const createRule = async (payload) => {
    try {
      await adminApi.createRule(payload);
      notify("Правило добавлено");
      await loadData();
    } catch (apiError) {
      setError(parseError(apiError));
    }
  };

  const updateRule = async (id, payload) => {
    try {
      await adminApi.updateRule(id, payload);
      notify("Правило обновлено");
      await loadData();
    } catch (apiError) {
      setError(parseError(apiError));
    }
  };

  const deleteRule = async (id) => {
    if (!window.confirm("Удалить правило?")) {
      return;
    }
    try {
      await adminApi.deleteRule(id);
      notify("Правило удалено");
      await loadData();
    } catch (apiError) {
      setError(parseError(apiError));
    }
  };

  if (loading) {
    return <p style={{ padding: 20 }}>Загрузка админки...</p>;
  }

  return (
    <main style={styles.page}>
      <header style={styles.header}>
        <div>
          <h1 style={styles.title}>Личный кабинет: Админ</h1>
          <p style={styles.subtitle}>
            Пользователь: {user.name} ({user.role})
          </p>
        </div>
        <button onClick={onLogout}>Выйти</button>
      </header>

      <nav style={styles.tabs}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            style={{
              ...styles.tabButton,
              ...(activeTab === tab.id ? styles.tabButtonActive : {}),
            }}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {error ? <div style={styles.error}>{error}</div> : null}
      {message ? <div style={styles.message}>{message}</div> : null}

      {activeTab === "systems" ? (
        <section style={styles.grid}>
          <TemplateForm
            onSubmit={editingSystem ? updateSystem : createSystem}
            initialTemplate={editingSystem}
            submitLabel={editingSystem ? "Сохранить систему" : "Добавить систему"}
            onCancel={editingSystem ? () => setEditingSystem(null) : undefined}
          />

          <section style={styles.card}>
            <h3>Список систем</h3>
            <ul style={styles.list}>
              {systems.map((system) => (
                <li key={system.id} style={styles.listItem}>
                  <button
                    type="button"
                    style={{
                      ...styles.selectSystemButton,
                      ...(selectedSystemId === system.id ? styles.selectSystemButtonActive : {}),
                    }}
                    onClick={() => setSelectedSystemId(system.id)}
                  >
                    <strong>{system.name}</strong>
                    <span style={styles.muted}>{system.description || "Без описания"}</span>
                  </button>
                  <div style={styles.row}>
                    <button type="button" onClick={() => setEditingSystem(system)}>
                      Редактировать
                    </button>
                    <button type="button" onClick={() => removeSystem(system.id)}>
                      Удалить
                    </button>
                  </div>
                </li>
              ))}
              {!systems.length ? <li>Пока нет систем</li> : null}
            </ul>
          </section>

          <SchemaViewer
            title={selectedSystem ? `Схема: ${selectedSystem.name}` : "Схема системы"}
            schema={selectedSystem?.schema || ""}
            allowEditing={false}
          />
        </section>
      ) : null}

      {activeTab === "roles" ? (
        <section style={styles.card}>
          <h3>{editingRoleId ? "Редактировать роль" : "Добавить роль"}</h3>
          <form onSubmit={submitRole} style={styles.formGrid}>
            <input
              required
              placeholder="Имя"
              value={roleForm.name}
              onChange={(event) => setRoleForm((prev) => ({ ...prev, name: event.target.value }))}
            />
            <input
              required
              type="email"
              placeholder="Email"
              value={roleForm.email}
              onChange={(event) => setRoleForm((prev) => ({ ...prev, email: event.target.value }))}
            />
            <input
              type="password"
              required={!editingRoleId}
              placeholder={editingRoleId ? "Новый пароль (необязательно)" : "Пароль"}
              value={roleForm.password}
              onChange={(event) =>
                setRoleForm((prev) => ({ ...prev, password: event.target.value }))
              }
            />
            <select
              value={roleForm.role}
              onChange={(event) => setRoleForm((prev) => ({ ...prev, role: event.target.value }))}
            >
              <option value="аналитик">аналитик</option>
              <option value="админ">админ</option>
            </select>
            <button type="submit">{editingRoleId ? "Сохранить" : "Добавить"}</button>
            {editingRoleId ? (
              <button
                type="button"
                onClick={() => {
                  setEditingRoleId(null);
                  setRoleForm(emptyRoleForm);
                }}
              >
                Отмена
              </button>
            ) : null}
          </form>

          <table style={styles.table}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Имя</th>
                <th>Email</th>
                <th>Роль</th>
                <th>Управление</th>
              </tr>
            </thead>
            <tbody>
              {roles.map((item) => (
                <tr key={item.id}>
                  <td>{item.id}</td>
                  <td>{item.name}</td>
                  <td>{item.email}</td>
                  <td>{item.role}</td>
                  <td style={styles.row}>
                    <button type="button" onClick={() => startEditRole(item)}>
                      Редактировать
                    </button>
                    <button type="button" onClick={() => removeRole(item.id)}>
                      Удалить
                    </button>
                  </td>
                </tr>
              ))}
              {!roles.length ? (
                <tr>
                  <td colSpan={5}>Роли не созданы</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </section>
      ) : null}

      {activeTab === "rules" ? (
        <RuleTable
          rules={rules}
          templates={systems}
          roleOptions={roles}
          onCreate={createRule}
          onUpdate={updateRule}
          onDelete={deleteRule}
        />
      ) : null}
    </main>
  );
}

const styles = {
  page: {
    maxWidth: 1280,
    margin: "0 auto",
    padding: 20,
    background: "#f4f7ff",
    minHeight: "100vh",
    display: "grid",
    gap: 14,
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    border: "1px solid #dde2f2",
    borderRadius: 12,
    padding: 16,
    background: "#fff",
  },
  title: { margin: 0 },
  subtitle: { margin: "4px 0 0", color: "#4d5a82" },
  tabs: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
  },
  tabButton: {
    border: "1px solid #c8d0eb",
    background: "#fff",
    borderRadius: 10,
    padding: "8px 14px",
    cursor: "pointer",
  },
  tabButtonActive: {
    background: "#1f4fff",
    color: "#fff",
    borderColor: "#1f4fff",
  },
  grid: {
    display: "grid",
    gap: 14,
    gridTemplateColumns: "1.1fr 1fr 1fr",
  },
  card: {
    border: "1px solid #dde2f2",
    borderRadius: 12,
    background: "#fff",
    padding: 16,
  },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: 8,
    marginBottom: 14,
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
  row: { display: "flex", gap: 6, flexWrap: "wrap" },
  list: { listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 8 },
  listItem: {
    display: "grid",
    gridTemplateColumns: "1fr auto",
    gap: 8,
    border: "1px solid #e6ebfb",
    borderRadius: 10,
    padding: 8,
    alignItems: "center",
  },
  selectSystemButton: {
    border: "1px solid #e6ebfb",
    borderRadius: 8,
    padding: 8,
    textAlign: "left",
    background: "#fff",
    display: "grid",
    gap: 4,
    cursor: "pointer",
  },
  selectSystemButtonActive: {
    borderColor: "#1f4fff",
    background: "#edf2ff",
  },
  muted: { color: "#596993", fontSize: 13 },
  error: {
    color: "#900",
    background: "#ffeaea",
    border: "1px solid #f0b1b1",
    borderRadius: 8,
    padding: 10,
  },
  message: {
    color: "#0b5",
    background: "#ebfff4",
    border: "1px solid #9ce2be",
    borderRadius: 8,
    padding: 10,
  },
};

export default AdminDashboard;
