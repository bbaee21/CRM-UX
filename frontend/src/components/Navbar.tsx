import { NavLink, useNavigate } from "react-router-dom";

const tabs = [
  { to: "/templates", label: "Message Template" },
  { to: "/research",  label: "UX Research" },
  { to: "/board",     label: "Issue Board" },
];


export default function Navbar() {

    const navigate = useNavigate();

    const gotoHome = () => {
        navigate("/");
    }
    
  return (
    <header className="bg-white shadow-sm">
      <nav className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
        {/* 좌측 로고 */}
        <h1 className="text-lg font-bold" onClick={gotoHome}>CRM UX</h1>

        {/* 우측 탭 */}
        <ul className="flex gap-6">
          {tabs.map(({ to, label }) => (
            <li key={to}>
              <NavLink
                to={to}
                className={({ isActive }) =>
                  `pb-2 border-b-2 transition ${
                    isActive ? "border-indigo-600 text-indigo-600"
                              : "border-transparent hover:text-gray-600"
                  }`
                }
              >
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}