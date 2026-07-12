import { NavLink } from 'react-router-dom';

const TABS = [
  { to: '/admin/departments', label: 'Departments' },
  { to: '/admin/categories', label: 'Categories' },
  { to: '/admin/employees', label: 'Employee Directory' },
];

function OrgSetupTabs() {
  return (
    <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-4">
      {TABS.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          className={({ isActive }) =>
            isActive
              ? 'rounded-full bg-accent-500 px-4 py-1.5 text-sm font-medium text-white'
              : 'rounded-full border border-gray-200 px-4 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50'
          }
        >
          {tab.label}
        </NavLink>
      ))}
    </div>
  );
}

export default OrgSetupTabs;
