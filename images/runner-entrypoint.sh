#!/bin/sh
set -u

# Prepared task environments keep their immutable dependency trees under
# /app. The measured workspace is a bind mount, so expose those dependencies
# through symlinks without copying them or reaching the network. The variables
# are overridable only for the no-spend shell test; production defaults are
# fixed by the runner image contract.
task_root=${AOB_TASK_ROOT:-/app}
workspace=${AOB_WORKSPACE:-/work/workspace}

link_dependency_tree() {
	source=$1
	destination=$2
	[ -d "$source" ] || return 0
	[ ! -e "$destination" ] || return 0
	mkdir -p "$destination"
	for dependency in "$source"/* "$source"/.[!.]*; do
		[ -e "$dependency" ] || continue
		name=${dependency##*/}
		ln -s "$dependency" "$destination/$name"
	done
}

link_dependency_tree "$task_root/node_modules" "$workspace/node_modules"
for package in backend frontend; do
	link_dependency_tree "$task_root/$package/node_modules" "$workspace/$package/node_modules"
done

# Put the mounted checkout ahead of the task image's build-time `/app` path so
# test commands exercise the agent's edits rather than the immutable baseline.
if [ -d "$workspace" ]; then
	PYTHONPATH="$workspace${PYTHONPATH:+:$PYTHONPATH}"
	if [ -d "$workspace/src" ]; then
		PYTHONPATH="$workspace/src:$PYTHONPATH"
	fi
	export PYTHONPATH
fi

# The runner closes stdin so a CLI cannot wait for an interactive answer.
"$@" <&-
exit $?
