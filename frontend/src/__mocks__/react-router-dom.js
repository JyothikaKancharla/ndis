// Lightweight stub for react-router-dom — avoids TextEncoder dependency in CRA Jest
const React = require('react');

const mockNavigate = jest.fn();

const useNavigate = () => mockNavigate;

const Link = ({ children, to, ...props }) =>
  React.createElement('a', { href: to, ...props }, children);

const MemoryRouter = ({ children }) =>
  React.createElement(React.Fragment, null, children);

const Routes = ({ children }) => children;

const Route = ({ element }) => element || null;

module.exports = { useNavigate, Link, MemoryRouter, Routes, Route };
