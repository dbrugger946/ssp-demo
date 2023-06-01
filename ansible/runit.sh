ansible-playbook  -e="ocp_username=${OCP_USERNAME}" -e="openshift_version=4.12"    ./install.yaml -i inventory/openshift-2.yaml 
