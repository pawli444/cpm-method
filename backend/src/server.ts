import express, { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Wczytanie zmiennych środowiskowych z pliku .env
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// ==========================================
// 1. POŁĄCZENIE Z BAZĄ DANYCH MONGODB
// ==========================================
mongoose.connect(process.env.MONGO_URI as string)
    .then(() => console.log('✅ Połączono z bazą MongoDB'))
    .catch(err => console.error('❌ Błąd połączenia z bazą:', err));

// ==========================================
// 2. MODELE DANYCH (Mongoose Schemas)
// ==========================================
const UserSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }
});
const User = mongoose.model('User', UserSchema);

const ProjectSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    tasks: { type: Array, required: true } // Tutaj zapisujemy wyliczone węzły i zależności
}, { timestamps: true });
const Project = mongoose.model('Project', ProjectSchema);

// ==========================================
// 3. MIDDLEWARE AUTORYZACJI (Ochrona ścieżek)
// ==========================================
interface AuthRequest extends Request { user?: any; }

const protect = (req: AuthRequest, res: Response, next: NextFunction) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Brak dostępu, wymagany token JWT' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET as string);
        req.user = decoded;
        next();
    } catch (err) {
        res.status(401).json({ message: 'Niewłaściwy lub wygasły token' });
    }
};

// ==========================================
// 4. ENDPOINTY (REST API)
// ==========================================

// --- Rejestracja ---
app.post('/api/auth/register', async (req, res) => {
    try {
        const { email, password } = req.body;
        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ message: 'Użytkownik z tym mailem już istnieje' });

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await User.create({ email, password: hashedPassword });
        res.status(201).json({ message: 'Konto zostało pomyślnie utworzone' });
    } catch (err) {
        res.status(500).json({ message: 'Błąd serwera podczas rejestracji' });
    }
});

// --- Logowanie ---
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if (user && await bcrypt.compare(password, user.password)) {
            const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET as string, { expiresIn: '7d' });
            res.json({ token, email: user.email });
        } else {
            res.status(401).json({ message: 'Błędny email lub hasło' });
        }
    } catch (err) {
        res.status(500).json({ message: 'Błąd serwera podczas logowania' });
    }
});

// --- Zapisywanie nowego projektu CPM (wymaga tokena) ---
app.post('/api/projects', protect, async (req: AuthRequest, res: Response) => {
    try {
        const { title, tasks } = req.body;
        const project = await Project.create({ userId: req.user.userId, title, tasks });
        res.status(201).json(project);
    } catch (err) {
        res.status(500).json({ message: 'Nie udało się zapisać projektu' });
    }
});

// --- Pobieranie wszystkich projektów zalogowanego użytkownika ---
app.get('/api/projects', protect, async (req: AuthRequest, res: Response) => {
    try {
        const projects = await Project.find({ userId: req.user.userId }).sort({ createdAt: -1 });
        res.json(projects);
    } catch (err) {
        res.status(500).json({ message: 'Błąd pobierania projektów' });
    }
});

// --- Usuwanie projektu ---
app.delete('/api/projects/:id', protect, async (req: AuthRequest, res: Response) => {
    try {
        const project = await Project.findById(req.params.id);
        if (!project) return res.status(404).json({ message: 'Projekt nie znaleziony' });
        if (project.userId.toString() !== req.user.userId) return res.status(403).json({ message: 'Brak uprawnień' });

        await project.deleteOne();
        res.json({ message: 'Projekt usunięty' });
    } catch (err) {
        res.status(500).json({ message: 'Błąd usuwania projektu' });
    }
});

// ==========================================
// 5. URUCHOMIENIE SERWERA
// ==========================================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Serwer backendowy działa na porcie ${PORT}`);
});