import 'package:flutter/material.dart';
import '../../core/services/api_service.dart';

class PublishOfferScreen extends StatefulWidget {
  const PublishOfferScreen({super.key});

  @override
  State<PublishOfferScreen> createState() => _PublishOfferScreenState();
}

class _PublishOfferScreenState extends State<PublishOfferScreen> {
  final _titreCtrl = TextEditingController();
  final _descriptionCtrl = TextEditingController();
  final _villeCtrl = TextEditingController();
  final _filiereCtrl = TextEditingController();
  String _type = 'stage';
  bool _saving = false;
  String? _error;

  Future<void> _publish() async {
    setState(() {
      _saving = true;
      _error = null;
    });
    try {
      await ApiService.instance.post('/offers', {
        'titre': _titreCtrl.text,
        'description': _descriptionCtrl.text,
        'type': _type,
        'ville': _villeCtrl.text,
        'filiere_cible': _filiereCtrl.text,
      });
      if (mounted) Navigator.pop(context);
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Publier une offre')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          SegmentedButton<String>(
            segments: const [
              ButtonSegment(value: 'stage', label: Text('Stage')),
              ButtonSegment(value: 'emploi', label: Text('Emploi')),
            ],
            selected: {_type},
            onSelectionChanged: (s) => setState(() => _type = s.first),
          ),
          const SizedBox(height: 12),
          TextField(controller: _titreCtrl, decoration: const InputDecoration(labelText: 'Titre', border: OutlineInputBorder())),
          const SizedBox(height: 12),
          TextField(
            controller: _descriptionCtrl,
            maxLines: 5,
            decoration: const InputDecoration(labelText: 'Description', border: OutlineInputBorder()),
          ),
          const SizedBox(height: 12),
          TextField(controller: _villeCtrl, decoration: const InputDecoration(labelText: 'Ville', border: OutlineInputBorder())),
          const SizedBox(height: 12),
          TextField(
            controller: _filiereCtrl,
            decoration: const InputDecoration(labelText: 'Filiere ciblee', border: OutlineInputBorder()),
          ),
          if (_error != null) ...[
            const SizedBox(height: 12),
            Text(_error!, style: const TextStyle(color: Colors.red)),
          ],
          const SizedBox(height: 20),
          ElevatedButton(
            onPressed: _saving ? null : _publish,
            child: _saving ? const CircularProgressIndicator() : const Text('Publier'),
          ),
        ],
      ),
    );
  }
}
