import 'package:flutter/material.dart';
import '../../core/services/api_service.dart';
import '../../core/services/session_service.dart';

class OfferDetailScreen extends StatefulWidget {
  final String offerId;
  const OfferDetailScreen({super.key, required this.offerId});

  @override
  State<OfferDetailScreen> createState() => _OfferDetailScreenState();
}

class _OfferDetailScreenState extends State<OfferDetailScreen> {
  Map<String, dynamic>? _offer;
  bool _loading = true;
  bool _applying = false;
  String? _message;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final res = await ApiService.instance.get('/offers/${widget.offerId}');
    setState(() {
      _offer = res['data'] as Map<String, dynamic>;
      _loading = false;
    });
  }

  Future<void> _apply() async {
    if (!SessionService.instance.isLoggedIn) {
      setState(() => _message = 'Connectez-vous en tant qu\'etudiant pour postuler.');
      return;
    }
    setState(() => _applying = true);
    try {
      await ApiService.instance.post('/applications', {'offre_id': widget.offerId});
      setState(() => _message = 'Candidature envoyee avec succes !');
    } catch (e) {
      setState(() => _message = e.toString());
    } finally {
      if (mounted) setState(() => _applying = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return const Scaffold(body: Center(child: CircularProgressIndicator()));
    final offer = _offer!;
    final entreprise = offer['entreprise'] as Map<String, dynamic>?;

    return Scaffold(
      appBar: AppBar(title: Text(offer['titre'] ?? '')),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(entreprise?['nom_entreprise'] ?? '', style: Theme.of(context).textTheme.titleMedium),
              const SizedBox(height: 4),
              Text('${offer['ville'] ?? ''} · ${offer['type'] ?? ''}'),
              const SizedBox(height: 16),
              Text(offer['description'] ?? 'Pas de description.'),
              const SizedBox(height: 24),
              ElevatedButton(
                onPressed: _applying ? null : _apply,
                child: _applying ? const CircularProgressIndicator() : const Text('Postuler'),
              ),
              if (_message != null) ...[
                const SizedBox(height: 12),
                Text(_message!),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
