import 'package:flutter/material.dart';
import '../../core/services/api_service.dart';

/// Cas d'utilisation "Effectuer test" + "Consulter son score de compatibilite par specialisation"
/// + "Consulter l'explication de sa recommandation".
class OrientationTestScreen extends StatefulWidget {
  const OrientationTestScreen({super.key});

  @override
  State<OrientationTestScreen> createState() => _OrientationTestScreenState();
}

class _OrientationTestScreenState extends State<OrientationTestScreen> {
  // Exemple de questionnaire simplifie ; a completer selon le referentiel pedagogique.
  final Map<String, String> _reponses = {
    "J'aime resoudre des problemes logiques": '',
    "Je prefere le travail en equipe": '',
    "Je suis attire par la creation visuelle / design": '',
    "Je suis a l'aise avec les chiffres et l'analyse de donnees": '',
    "Je m'interesse aux reseaux et a l'infrastructure informatique": '',
  };

  bool _submitting = false;
  String? _message;

  Future<void> _submit() async {
    setState(() => _submitting = true);
    try {
      await ApiService.instance.post('/students/me/orientation-test', {
        'reponses': _reponses.entries.map((e) => {'question': e.key, 'reponse': e.value}).toList(),
      });
      setState(() => _message = 'Test enregistre ! Consultez vos recommandations depuis votre profil.');
    } catch (e) {
      setState(() => _message = e.toString());
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text("Test d'orientation")),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          ..._reponses.keys.map((question) {
            return Card(
              margin: const EdgeInsets.only(bottom: 12),
              child: Padding(
                padding: const EdgeInsets.all(12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(question, style: const TextStyle(fontWeight: FontWeight.w600)),
                    const SizedBox(height: 8),
                    Wrap(
                      spacing: 8,
                      children: ["Pas du tout", "Un peu", "Beaucoup"].map((v) {
                        return ChoiceChip(
                          label: Text(v),
                          selected: _reponses[question] == v,
                          onSelected: (_) => setState(() => _reponses[question] = v),
                        );
                      }).toList(),
                    ),
                  ],
                ),
              ),
            );
          }),
          const SizedBox(height: 8),
          ElevatedButton(
            onPressed: _submitting ? null : _submit,
            child: _submitting ? const CircularProgressIndicator() : const Text('Valider le test'),
          ),
          if (_message != null) ...[
            const SizedBox(height: 12),
            Text(_message!),
          ],
        ],
      ),
    );
  }
}
