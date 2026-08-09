import 'package:flutter/material.dart';
import '../../core/services/api_service.dart';
import '../../core/theme/app_colors.dart';
import 'offer_detail_screen.dart';

class OffersListScreen extends StatefulWidget {
  const OffersListScreen({super.key});

  @override
  State<OffersListScreen> createState() => _OffersListScreenState();
}

class _OffersListScreenState extends State<OffersListScreen> {
  List<dynamic> _offers = [];
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final res = await ApiService.instance.get('/offers');
      setState(() => _offers = res['data'] as List<dynamic>);
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Offres & stages')),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
          ? Center(child: Text(_error!))
          : RefreshIndicator(
        onRefresh: _load,
        child: ListView.separated(
          padding: const EdgeInsets.all(16),
          itemCount: _offers.length,
          separatorBuilder: (_, __) => const SizedBox(height: 12),
          itemBuilder: (context, i) {
            final offer = _offers[i] as Map<String, dynamic>;
            final entreprise = offer['entreprise'] as Map<String, dynamic>?;
            return Card(
              child: ListTile(
                title: Text(offer['titre'] ?? ''),
                subtitle: Text('${entreprise?['nom_entreprise'] ?? ''} · ${offer['ville'] ?? ''}'),
                trailing: Chip(
                  label: Text(offer['type'] ?? ''),
                  backgroundColor: AppColors.background,
                ),
                onTap: () => Navigator.push(
                  context,
                  MaterialPageRoute(builder: (_) => OfferDetailScreen(offerId: offer['id'])),
                ),
              ),
            );
          },
        ),
      ),
    );
  }
}
