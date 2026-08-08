import 'package:flutter/material.dart';
import '../../core/services/api_service.dart';

/// Cas d'utilisation "suivre sa progression" (candidatures de l'etudiant).
class ApplicationsScreen extends StatefulWidget {
  const ApplicationsScreen({super.key});

  @override
  State<ApplicationsScreen> createState() => _ApplicationsScreenState();
}

class _ApplicationsScreenState extends State<ApplicationsScreen> {
  List<dynamic> _applications = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final res = await ApiService.instance.get('/applications/me');
    setState(() {
      _applications = res['data'] as List<dynamic>;
      _loading = false;
    });
  }

  Color _statusColor(String statut) {
    switch (statut) {
      case 'acceptee':
        return Colors.green;
      case 'refusee':
        return Colors.red;
      default:
        return Colors.orange;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Mes candidatures')),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
        onRefresh: _load,
        child: ListView.builder(
          padding: const EdgeInsets.all(16),
          itemCount: _applications.length,
          itemBuilder: (context, i) {
            final c = _applications[i] as Map<String, dynamic>;
            final offre = c['offre'] as Map<String, dynamic>?;
            final entreprise = offre?['entreprise'] as Map<String, dynamic>?;
            return Card(
              child: ListTile(
                title: Text(offre?['titre'] ?? ''),
                subtitle: Text(entreprise?['nom_entreprise'] ?? ''),
                trailing: Chip(
                  label: Text(c['statut'] ?? ''),
                  backgroundColor: _statusColor(c['statut'] ?? '').withValues(alpha: 0.15),
                  labelStyle: TextStyle(color: _statusColor(c['statut'] ?? '')),
                ),
              ),
            );
          },
        ),
      ),
    );
  }
}
