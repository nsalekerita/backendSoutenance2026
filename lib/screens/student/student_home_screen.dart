import 'package:flutter/material.dart';
import '../../core/services/session_service.dart';
import '../../core/theme/app_colors.dart';
import '../home/home_screen.dart';
import '../offers/offers_list_screen.dart';
import '../applications/applications_screen.dart';
import 'orientation_test_screen.dart';
import 'chatbot_screen.dart';
import 'profile_screen.dart';

/// Espace etudiant : point d'entree apres connexion.
/// Regroupe les cas d'utilisation "Etudiant" du cahier des charges.
class StudentHomeScreen extends StatelessWidget {
  const StudentHomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final tiles = [
      _Tile(icon: Icons.person_outline, label: 'Mon profil', page: const ProfileScreen()),
      _Tile(icon: Icons.quiz_outlined, label: "Test d'orientation", page: const OrientationTestScreen()),
      _Tile(icon: Icons.smart_toy_outlined, label: 'Assistant IA', page: const ChatbotScreen()),
      _Tile(icon: Icons.work_outline, label: 'Offres & stages', page: const OffersListScreen()),
      _Tile(icon: Icons.assignment_turned_in_outlined, label: 'Mes candidatures', page: const ApplicationsScreen()),
    ];

    return Scaffold(
      appBar: AppBar(
        title: const Text('Espace etudiant'),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: () async {
              await SessionService.instance.clear();
              if (context.mounted) {
                Navigator.pushAndRemoveUntil(
                  context,
                  MaterialPageRoute(builder: (_) => const HomeScreen()),
                      (route) => false,
                );
              }
            },
          ),
        ],
      ),
      body: GridView.count(
        padding: const EdgeInsets.all(16),
        crossAxisCount: 2,
        mainAxisSpacing: 16,
        crossAxisSpacing: 16,
        children: tiles,
      ),
    );
  }
}

class _Tile extends StatelessWidget {
  final IconData icon;
  final String label;
  final Widget page;
  const _Tile({required this.icon, required this.label, required this.page});

  @override
  Widget build(BuildContext context) {
    return InkWell(
      borderRadius: BorderRadius.circular(16),
      onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => page)),
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppColors.cardGrey),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: 36, color: AppColors.darkGreen),
            const SizedBox(height: 10),
            Text(label, textAlign: TextAlign.center, style: const TextStyle(fontWeight: FontWeight.w600)),
          ],
        ),
      ),
    );
  }
}
