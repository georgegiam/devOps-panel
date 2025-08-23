import axios from "axios";
import { io, Socket } from "socket.io-client";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5001";

export const api = axios.create({ baseURL: API_URL });
export const socket: Socket = io(API_URL, { transports: ["websocket"] });
