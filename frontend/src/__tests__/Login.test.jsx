import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import Login from '../pages/auth/Login';
import { AuthContext } from '../context/AuthContext';
import api from '../api/api';

// Mock only the api module
jest.mock('../api/api');

// Strip framer-motion animation props so React doesn't warn about unknown DOM attributes
jest.mock('framer-motion', () => ({
  motion: {
    div:    ({ children, initial, animate, exit, transition, whileHover, whileTap, whileFocus, whileDrag, whileInView, variants, ...props }) => <div {...props}>{children}</div>,
    form:   ({ children, initial, animate, exit, transition, whileHover, whileTap, whileFocus, whileDrag, whileInView, variants, ...props }) => <form {...props}>{children}</form>,
    button: ({ children, initial, animate, exit, transition, whileHover, whileTap, whileFocus, whileDrag, whileInView, variants, ...props }) => <button {...props}>{children}</button>,
  },
}));

const renderLogin = (setUser = jest.fn()) =>
  render(
    <AuthContext.Provider value={{ setUser }}>
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    </AuthContext.Provider>
  );

// ─── Render tests ──────────────────────────────────────────────────────────

describe('Login component - rendering', () => {
  test('renders email and password inputs', () => {
    renderLogin();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  test('renders Sign In button', () => {
    renderLogin();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  test('renders Sign up link', () => {
    renderLogin();
    expect(screen.getByText(/sign up/i)).toBeInTheDocument();
  });

  test('renders NexCare title', () => {
    renderLogin();
    expect(screen.getByText('NexCare')).toBeInTheDocument();
  });
});

// ─── Input tests ───────────────────────────────────────────────────────────

describe('Login component - inputs', () => {
  test('updates email field when typed', () => {
    renderLogin();
    const emailInput = screen.getByLabelText(/email address/i);
    fireEvent.change(emailInput, { target: { value: 'test@example.com', name: 'email' } });
    expect(emailInput.value).toBe('test@example.com');
  });

  test('updates password field when typed', () => {
    renderLogin();
    const passwordInput = screen.getByLabelText(/password/i);
    fireEvent.change(passwordInput, { target: { value: 'mypassword', name: 'password' } });
    expect(passwordInput.value).toBe('mypassword');
  });
});

// ─── Submit / API tests ────────────────────────────────────────────────────

describe('Login component - form submission', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  test('calls api.post with correct email and password', async () => {
    api.post.mockResolvedValueOnce({
      data: { token: 'fake-token', user: { id: '1', name: 'Staff', email: 'staff@test.com', role: 'staff' } }
    });

    renderLogin();
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'staff@test.com', name: 'email' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123', name: 'password' } });
    fireEvent.submit(screen.getByRole('button', { name: /sign in/i }).closest('form'));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/api/auth/login', {
        email: 'staff@test.com',
        password: 'password123',
      });
    });
  });

  test('saves token to localStorage on successful login', async () => {
    api.post.mockResolvedValueOnce({
      data: { token: 'fake-token', user: { id: '1', name: 'Staff', email: 'staff@test.com', role: 'staff' } }
    });

    renderLogin();
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'staff@test.com', name: 'email' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123', name: 'password' } });
    fireEvent.submit(screen.getByRole('button', { name: /sign in/i }).closest('form'));

    await waitFor(() => {
      expect(localStorage.getItem('token')).toBe('fake-token');
    });
  });

  test('calls setUser with user data on successful login', async () => {
    const mockSetUser = jest.fn();
    const user = { id: '1', name: 'Staff', email: 'staff@test.com', role: 'staff' };
    api.post.mockResolvedValueOnce({ data: { token: 'fake-token', user } });

    renderLogin(mockSetUser);
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'staff@test.com', name: 'email' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123', name: 'password' } });
    fireEvent.submit(screen.getByRole('button', { name: /sign in/i }).closest('form'));

    await waitFor(() => {
      expect(mockSetUser).toHaveBeenCalledWith(user);
    });
  });

  test('shows error message on invalid credentials (401)', async () => {
    api.post.mockRejectedValueOnce({
      response: { data: { message: 'Invalid credentials' } }
    });

    renderLogin();
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'wrong@test.com', name: 'email' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'wrongpass', name: 'password' } });
    fireEvent.submit(screen.getByRole('button', { name: /sign in/i }).closest('form'));

    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
    });
  });

  test('shows generic error when no server response', async () => {
    api.post.mockRejectedValueOnce(new Error('Network Error'));

    renderLogin();
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'test@test.com', name: 'email' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'pass', name: 'password' } });
    fireEvent.submit(screen.getByRole('button', { name: /sign in/i }).closest('form'));

    await waitFor(() => {
      expect(screen.getByText(/unable to connect/i)).toBeInTheDocument();
    });
  });

  test('shows Signing in... while loading', async () => {
    api.post.mockImplementation(() => new Promise(() => {})); // never resolves

    renderLogin();
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'test@test.com', name: 'email' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'pass123', name: 'password' } });
    fireEvent.submit(screen.getByRole('button', { name: /sign in/i }).closest('form'));

    expect(await screen.findByText(/signing in/i)).toBeInTheDocument();
  });

  test('error clears when user starts typing after a failed login', async () => {
    api.post.mockRejectedValueOnce({
      response: { data: { message: 'Invalid credentials' } }
    });

    renderLogin();
    const emailInput = screen.getByLabelText(/email address/i);
    fireEvent.change(emailInput, { target: { value: 'wrong@test.com', name: 'email' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'wrongpass', name: 'password' } });
    fireEvent.submit(screen.getByRole('button', { name: /sign in/i }).closest('form'));

    await waitFor(() => expect(screen.getByText('Invalid credentials')).toBeInTheDocument());

    // Start typing again — error should clear
    fireEvent.change(emailInput, { target: { value: 'new@test.com', name: 'email' } });
    expect(screen.queryByText('Invalid credentials')).not.toBeInTheDocument();
  });
});
