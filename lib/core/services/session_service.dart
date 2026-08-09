import 'package:shared_preferences/shared_preferences.dart';
import 'api_service.dart';

/// Garde en memoire (et sur disque) le token JWT + role de l'utilisateur connecte.
class SessionService {
  SessionService._internal();
  static final SessionService instance = SessionService._internal();

  String? token;
  String? role; // 'etudiant' | 'entreprise' | 'admin'
  String? userId;

  Future<void> loadFromDisk() async {
    final prefs = await SharedPreferences.getInstance();
    token = prefs.getString('token');
    role = prefs.getString('role');
    userId = prefs.getString('userId');
    if (token != null) ApiService.instance.setToken(token);
  }

  Future<void> save({required String token, required String role, required String userId}) async {
    this.token = token;
    this.role = role;
    this.userId = userId;
    ApiService.instance.setToken(token);

    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('token', token);
    await prefs.setString('role', role);
    await prefs.setString('userId', userId);
  }

  Future<void> clear() async {
    token = null;
    role = null;
    userId = null;
    ApiService.instance.setToken(null);
    final prefs = await SharedPreferences.getInstance();
    await prefs.clear();
  }

  bool get isLoggedIn => token != null;
}
