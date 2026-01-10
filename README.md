# AweRoFaM: Awesome Robot Failure Management

A curated list of resources related to robot failure management (detection, diagnosis, recovery).

Maintainer: [Alex Mitrevski](https://alex-mitrevski.com)

## Contents

* [Publications](publications.md)
    * [Execution monitoring / anomaly and failure detection, and failure recovery](monitoring-failure-detection-recovery.md)
    * [Failure diagnosis](failure-diagnosis.md)
    * [Human factors](human-factors.md)
    * [Surveys and books](surveys-and-books.md)
* [Failure datasets](datasets.md)
* [Relevant workshops](workshops.md)

## Why This Resource

Autonomous robots will hardly be accepted or deemed useful in practical applications if they are unable to deal with the fact that they might fail, as failures can lead to downtime, or may damage the environment or the robot itself. Work on robot failures explicitly acknowledges this fact and either proposes methods that make it possible to detect and resolve failures or analyses the effect failures have on the use of robots.

This repository has two primary objectives:
1. The first objective is for this to be a **centralised** collection of work on robot failures, thereby making it easier for others to find such work and build upon it. The list is not meant to compete with traditional literature surveys (after all, we only collect resources here, including surveys); however, given that the repository is actively maintained, it at least aims to be more up-to-date than any survey article can be.
2. The repository also serves as a **historical archive** of work done in the context of robot failures. Particularly given the incremental nature of scientific research, interesting old(er) research can sometimes fall under the radar; by collecting all work done in the field, the repository ensures that such work will at least not be forgotten.

## Who This Resource Is For

The resource is primarily aimed at researchers and robotics professionals who are actively working on addressing robot failures or are simply interested in such work. Newcomers to the field of robot failures may also benefit from the repository, particularly for identifying relevant resources to look into.

## Contributing

Feel free to make a pull request if you find something missing and / or to add new, relevant resources. If this is your first time contributing, please also include your name and link to your page (e.g. personal website) in the [list of contributors](contributors.md).

Contributions should follow the rules below:
* Resources should **explicitly** deal with some aspects of robot failures (for instance, this excludes resources where failure recovery is an emergent by-product of a learning process)
* The resources on all pages should **follow a chronological order** (starting from the most recent resources).
* When adding publications:
    * Please follow the existing format for structuring references (in particular, I follow the **IEEE reference format**).
    * Please **include the DOI whenever possible**. Preprints will only be accepted in exceptional cases (e.g. if a highly influential paper is only available as a preprint and has not been officially published anywhere, or if a workshop paper is included in the list).
* Robotics-adjacent resources will also be included **if they have relevance for robotics** (e.g. work on vision-based anomaly detection or work dealing with failures in autonomous driving).
* **Only resources that are available online in some form will be included** (e.g. workshop papers that haven't even been put on arXiv and thus cannot be downloaded will not be included).

## Citing

If you find this resource useful for your work, please consider citing it as follows:
```
@misc{awerofam,
    author = {Mitrevski, A. and others},
    title = {{AweRoFaM: A Curated List of Resources Related to Robot Failure Management}},
    year = {2025},
    howpublished = {Online},
    url = {\url{https://robot-failures.github.io/awesome-robot-failure-management/}}
}
```