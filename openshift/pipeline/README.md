This directory contains a Jenkinsfile which can be used to build
totocabs-api using an OpenShift build pipeline.

To do this, run:

```bash
# create the nodejs example as usual
oc new-app https://github.com/sudksing/totocabs-api

# now create the pipeline build controller from the openshift/pipeline
# subdirectory
oc new-app https://github.com/sudksing/totocabs-api \
  --context-dir=openshift/pipeline --name totocabs-api-pipeline
```
