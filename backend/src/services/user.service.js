import bcrypt from 'bcryptjs';
import { readUsers, writeUsers, findUserByEmail as findByEmailFromStore } from '../store/user.store.js';

// Seed ensured via readUsers in store; this is a no-op kept for compatibility
export async function seedUsers() {
  await readUsers();
}

// User CRUD operations using JSON file store
export async function createUser(userData) {
  const users = await readUsers();
  const exists = users.find(u => u.email.toLowerCase() === String(userData.email).toLowerCase());
  if (exists) throw new Error('Email already registered.');
  const toSave = { ...userData, createdAt: new Date().toISOString() };
  users.push(toSave);
  await writeUsers(users);
  return toSave;
}

export async function findUserByEmail(email) {
  return await findByEmailFromStore(email);
}

export async function findUserById(id) {
  const users = await readUsers();
  return users.find(u => u.id === id) || null;
}

export async function updateUser(id, updateData) {
  const users = await readUsers();
  const idx = users.findIndex(u => u.id === id);
  if (idx === -1) return null;
  users[idx] = { ...users[idx], ...updateData };
  await writeUsers(users);
  return users[idx];
}

export async function getAllUsers() {
  return await readUsers();
}
