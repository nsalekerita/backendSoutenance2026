import 'package:flutter/material.dart';
import '../../core/services/api_service.dart';

/// Cas d'utilisation "Modifier son profil" + "Renseigner ses notes/competences".
class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  final _filiereCtrl = TextEditingController();
  final _niveauCtrl = TextEditingController();
  final _interetsCtrl = TextEditingController();
  final _objectifsCtrl = TextEditingController();
  bool _loading = true;
  bool _saving = false;
  String? _message;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final res = await ApiService.instance.get('/students/me');
      final data = res['data'] as Map<String, dynamic>;
      _filiereCtrl.text = data['filiere'] ?? '';
      _niveauCtrl.text = data['niveau'] ?? '';
      _interetsCtrl.text = data['centres_interet'] ?? '';
      _objectifsCtrl.text = data['objectifs_professionnels'] ?? '';
    } catch (e) {
      _message = e.toString();
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _save() async {
    setState(() => _saving = true);
    try {
      await ApiService.instance.put('/students/me', {
        'filiere': _filiereCtrl.text,
        'niveau': _niveauCtrl.text,
        'centres_interet': _interetsCtrl.text,
        'objectifs_professionnels': _objectifsCtrl.text,
      });
      setState(() => _message = 'Profil enregistre');
    } catch (e) {
      setState(() => _message = e.toString());
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return const Scaffold(body: Center(child: CircularProgressIndicator()));

    return Scaffold(
      appBar: AppBar(title: const Text('Mon profil')),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: ListView(
          children: [
            TextField(controller: _filiereCtrl, decoration: const InputDecoration(labelText: 'Filiere', border: OutlineInputBorder())),
            const SizedBox(height: 12),
            TextField(controller: _niveauCtrl, decoration: const InputDecoration(labelText: 'Niveau', border: OutlineInputBorder())),
            const SizedBox(height: 12),
            TextField(
              controller: _interetsCtrl,
              maxLines: 3,
              decoration: const InputDecoration(labelText: "Centres d'interet", border: OutlineInputBorder()),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _objectifsCtrl,
              maxLines: 3,
              decoration: const InputDecoration(labelText: 'Objectifs professionnels', border: OutlineInputBorder()),
            ),
            const SizedBox(height: 20),
            ElevatedButton(
              onPressed: _saving ? null : _save,
              child: _saving ? const CircularProgressIndicator() : const Text('Enregistrer'),
            ),
            if (_message != null) ...[
              const SizedBox(height: 12),
              Text(_message!),
            ],
          ],
        ),
      ),
    );
  }
}
