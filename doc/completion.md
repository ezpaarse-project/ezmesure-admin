# cluster

## Usage

```bash
$ ezmesure-admin completion
```

> Enable bash/zsh-completion shortcuts for commands and options.

## Commands

To enable ``bash/zsh`` completions, **concat** the generated script **to your** ``.bashrc`` or ``.bash_profile`` (or ``.zshrc`` or ``.zsh_profile on OSX`` for zsh)

### Commands details

#### Run command to see script :

```bash
$ ezmesure-admin completion

###-begin-ezmesure-admin-completions-###
#
# yargs command completion script
#
# Installation: ezmesure-admin completion >> ~/.zshrc
#    or ezmesure-admin completion >> ~/.zsh_profile on OSX.
#
_ezmesure-admin_yargs_completions()
{
  local reply
  local si=$IFS
  IFS=$'
' reply=($(COMP_CWORD="$((CURRENT-1))" COMP_LINE="$BUFFER" COMP_POINT="$CURSOR" ezmesure-admin --get-yargs-completions "${words[@]}"))
  IFS=$si
  _describe 'values' reply
}
compdef _ezmesure-admin_yargs_completions ezmesure-admin
###-end-ezmesure-admin-completions-###
```

#### Run command to add script in .bashrc

```bash
$ ezmesure-admin completion >> ~/.bashrc
```

#### Run command to add script in .bash_profile

```bash
$ ezmesure-admin completion >> ~/.bash_profile
```

#### Run command to add script in .zsh_profile

```bash
$ ezmesure-admin completion >> ~/.zsh_profile
```