import 'package:flutter/material.dart';
import '../../core/services/api_service.dart';
import '../../core/services/session_service.dart';
import '../home/home_screen.dart';

/// Espace administrateur : "Gerer les comptes utilisateurs", "Valider les comptes entreprises",
/// "Consulter les statistiques globales", "Superviser le fonctionnement des recommandations IA".
class AdminDashboardScreen extends StatefulWidget {
  const AdminDashboardScreen({super.key});

  @override
  State<AdminDashboardScreen> createState() => _AdminDashboardScreenState();
}

class _AdminDashboardScreenState extends State<AdminDashboardScreen> {
  Map<String, dynamic>? _stats;
  List<dynamic> _offers = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    final statsRes = await ApiService.instance.get('/admin/stats');
    final offersRes = await ApiService.instance.get('/admin/offres', query: {'statut': 'en_attente'});
    setState(() {
      _stats = statsRes['data'] as Map<String, dynamic>;
      _offers = offersRes['data'] as List<dynamic>;
      _loading = false;
    });
  }

  Future<void> _validate(String id) async {
    await ApiService.instance.patch('/admin/offres/$id/statut', {'statut': 'validee'});
    _load();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Espace administrateur'),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: () async {
              await SessionService.instance.clear();
              if (context.mounted) {
                Navigator.pushAndRemoveUntil(context, MaterialPageRoute(builder: (_) => const HomeScreen()), (r) => false);
              }
            },
          ),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
        onRefresh: _load,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            Text('Statistiques', style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: 12),
            Wrap(
              spacing: 12,
              runSpacing: 12,
              children: [
                _StatCard(label: 'Etudiants', value: '${_stats?['nbEtudiants'] ?? 0}'),
                _StatCard(label: 'Entreprises', value: '${_stats?['nbEntreprises'] ?? 0}'),
                _StatCard(label: 'Offres', value: '${_stats?['nbOffres'] ?? 0}'),
                _StatCard(label: 'Candidatures', value: '${_stats?['nbCandidatures'] ?? 0}'),
              ],
            ),
            const SizedBox(height: 24),
            Text('Comptes entreprises en attente de validation', style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: 12),
            if (_offers.isEmpty) const Text('Aucune offre en attente.'),
            ..._offers.map((offerData) {
              final offer = offerData as Map<String, dynamic>;
              return Card(
                child: ListTile(
                  title: Text(offer['titre'] ?? ''),
                  subtitle: Text(offer['entreprises']?['nom'] ?? ''),
                  trailing: ElevatedButton(
                    onPressed: () => _validate(offer['id']),
                    child: const Text('Valider'),
                  ),
                ),
              );
            }),
          ],
        ),
      ),
    );
  }
}

class _StatCard extends StatelessWidget {
  final String label;
  final String value;
  const _StatCard({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 140,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12), boxShadow: const [
        BoxShadow(color: Colors.black12, blurRadius: 4),
      ]),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(value, style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w800)),
          Text(label, style: const TextStyle(color: Colors.grey)),
        ],
      ),
    );
  }
}
