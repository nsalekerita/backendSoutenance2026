import 'package:flutter/material.dart';
import '../../core/services/api_service.dart';
import '../../core/services/session_service.dart';
import '../home/home_screen.dart';
import 'publish_offer_screen.dart';
import 'candidates_screen.dart';

/// Espace entreprise : cas d'utilisation "Publier une offre", "Consulter les candidatures recues",
/// "Recevoir automatiquement la liste des etudiants compatibles", "Consulter les profils des etudiants".
class CompanyDashboardScreen extends StatefulWidget {
  const CompanyDashboardScreen({super.key});

  @override
  State<CompanyDashboardScreen> createState() => _CompanyDashboardScreenState();
}

class _CompanyDashboardScreenState extends State<CompanyDashboardScreen> {
  List<dynamic> _offres = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    final res = await ApiService.instance.get('/companies/me');
    setState(() {
      _offres = (res['data'] as Map<String, dynamic>)['offres'] as List<dynamic>? ?? [];
      _loading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Espace entreprise'),
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
      floatingActionButton: FloatingActionButton.extended(
        icon: const Icon(Icons.add),
        label: const Text('Publier une offre'),
        onPressed: () async {
          await Navigator.push(context, MaterialPageRoute(builder: (_) => const PublishOfferScreen()));
          _load();
        },
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
        onRefresh: _load,
        child: ListView.builder(
          padding: const EdgeInsets.all(16),
          itemCount: _offres.length,
          itemBuilder: (context, i) {
            final offre = _offres[i] as Map<String, dynamic>;
            return Card(
              child: ListTile(
                title: Text(offre['titre'] ?? ''),
                subtitle: Text('${offre['type']} · ${offre['ville'] ?? ''}'),
                trailing: const Icon(Icons.chevron_right),
                onTap: () => Navigator.push(
                  context,
                  MaterialPageRoute(builder: (_) => CandidatesScreen(offerId: offre['id'], offerTitle: offre['titre'])),
                ),
              ),
            );
          },
        ),
      ),
    );
  }
}
