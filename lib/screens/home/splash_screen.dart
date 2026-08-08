import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';
import 'home_screen.dart';

/// Ecran de lancement : le logo tourne sur un fond professionnel (degrade vert fonce)
/// avant d'afficher la page d'accueil, comme demande dans le cahier des charges.
class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> with SingleTickerProviderStateMixin {
  late final AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(vsync: this, duration: const Duration(seconds: 2))..repeat();

    Future.delayed(const Duration(milliseconds: 2200), () {
      if (!mounted) return;
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(builder: (_) => const HomeScreen()),
      );
    });
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [AppColors.darkGreen, Color(0xFF08402A)],
          ),
        ),
        child: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              RotationTransition(
                turns: _controller,
                child: Container(
                  width: 90,
                  height: 90,
                  decoration: BoxDecoration(
                    color: AppColors.white,
                    borderRadius: BorderRadius.circular(20),
                    boxShadow: [
                      BoxShadow(color: Colors.black.withValues(alpha: 0.2), blurRadius: 20, offset: const Offset(0, 8)),
                    ],
                  ),
                  alignment: Alignment.center,
                  child: const Text(
                    'IAI',
                    style: TextStyle(color: AppColors.darkGreen, fontSize: 22, fontWeight: FontWeight.w900),
                  ),
                ),
              ),
              const SizedBox(height: 24),
              RichText(
                text: const TextSpan(
                  style: TextStyle(fontSize: 26, fontWeight: FontWeight.w800, letterSpacing: 0.5),
                  children: [
                    TextSpan(text: 'IAI ', style: TextStyle(color: AppColors.white)),
                    TextSpan(text: 'Horizon', style: TextStyle(color: AppColors.gold)),
                  ],
                ),
              ),
              const SizedBox(height: 8),
              const Text(
                'Orientation academique & insertion professionnelle',
                style: TextStyle(color: Color(0xFFDCE8E0), fontSize: 12),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
