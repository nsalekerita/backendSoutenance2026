import 'package:flutter/material.dart';
import 'core/theme/app_theme.dart';
import 'core/services/session_service.dart';
import 'screens/home/splash_screen.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await SessionService.instance.loadFromDisk();
  runApp(const IAIHorizonApp());
}

class IAIHorizonApp extends StatelessWidget {
  const IAIHorizonApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'IAI Horizon',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.light,
      home: const SplashScreen(),
    );
  }
}
