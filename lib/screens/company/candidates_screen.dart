import 'package:flutter/material.dart';
import '../../core/services/api_service.dart';

/// Cas d'utilisation "Consulter les candidatures recues", "Accepter/refuser une candidature".
class CandidatesScreen extends StatefulWidget {
  final String offerId;
  final String offerTitle;
  const CandidatesScreen({super.key, required this.offerId, required this.offerTitle});

  @override
  State<CandidatesScreen> createState() => _CandidatesScreenState();
}

class _CandidatesScreenState extends State<CandidatesScreen> {
  List<dynamic> _candidatures = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    final res = await ApiService.instance.get('/applications/offer/${widget.offerId}');
    setState(() {
      _candidatures = res['data'] as List<dynamic>;
      _loading = false;
    });
  }

  Future<void> _decide(String id, bool accept) async {
    await ApiService.instance.patch('/applications/$id/${accept ? 'accept' : 'refuse'}', {});
    _load();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(widget.offerTitle)),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: _candidatures.length,
        itemBuilder: (context, i) {
          final c = _candidatures[i] as Map<String, dynamic>;
          final etudiant = c['etudiant'] as Map<String, dynamic>?;
          final utilisateur = etudiant?['utilisateur'] as Map<String, dynamic>?;
          final statut = c['statut'];
          return Card(
            child: ListTile(
              title: Text(utilisateur?['nom'] ?? 'Etudiant'),
              subtitle: Text('${utilisateur?['email'] ?? ''} · $statut'),
              trailing: statut == 'en_attente'
                  ? Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  IconButton(
                    icon: const Icon(Icons.check, color: Colors.green),
                    onPressed: () => _decide(c['id'], true),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close, color: Colors.red),
                    onPressed: () => _decide(c['id'], false),
                  ),
                ],
              )
                  : null,
            ),
          );
        },
      ),
    );
  }
}
