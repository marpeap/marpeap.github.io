
# MarpPilot - Déploiement depuis Termux

1. Ouvre Termux et installe Git :
```
pkg install git
```
2. Clone le dépôt :
```
git clone https://github.com/marpeap/marpeap.github.io.git
cd marpeap.github.io
```
3. Copie les fichiers du dossier MarpPilot ici (depuis ton gestionnaire de fichiers ou `cp`).
4. Ajoute, commit et push :
```
git add .
git commit -m "Déploiement MarpPilot MVP"
git push origin main
```

Le site sera en ligne sur : **https://marpeap.github.io**
