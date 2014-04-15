ANAGRAM_BIN=/var/lib/gds-2.0/bin
ANAGRAM_HOME=/var/lib/gds-2.0

if [ ! "$CATALINA_HOME" ] ; then # path to Tomcat code
    CATALINA_HOME="$ANAGRAM_HOME/../tomcat6"; export CATALINA_HOME;
fi
if [ ! "$CATALINA_BASE" ] ; then # path to Tomcat webapps
    CATALINA_BASE="$CATALINA_HOME"; export CATALINA_BASE;
fi
if [ ! "$JETTY_HOME" ] ; then # path to Jetty code
    JETTY_HOME="$ANAGRAM_HOME/jetty4"; export JETTY_HOME;
fi
if [ ! "$JETTY_CONFIG" ] ; then # path to Jetty XML file
    JETTY_CONFIG="$JETTY_HOME/jetty-gds.xml"; export JETTY_CONFIG;
fi
if [ ! "$JETTY_PORT" ] ; then # main port for Jetty
    JETTY_PORT="9090"; export JETTY_PORT;
fi
if [ ! "$JETTY_STOP_PORT" ] ; then # port to shut down Jetty
    JETTY_STOP_PORT="9089"; export JETTY_STOP_PORT;
fi
if [ ! "$ANAGRAM_BASE" ] ; then # path to GDS instance data (config, temp, log)
    ANAGRAM_BASE="$ANAGRAM_HOME"; export ANAGRAM_BASE;
fi
if [ ! "$ANAGRAM_CONFIG" ] ; then # path to GDS config file
    ANAGRAM_CONFIG="$ANAGRAM_BASE/gds.xml"; export ANAGRAM_CONFIG ;
fi
if [ ! "$ANAGRAM_CONSOLE" ] ; then # path to console output
    ANAGRAM_CONSOLE="$ANAGRAM_BASE/log/console.out"; export ANAGRAM_CONSOLE;
fi
if [ ! "$ANAGRAM_TEMP" ] ; then # path to temp data
    ANAGRAM_TEMP="$ANAGRAM_BASE/temp"; export ANAGRAM_TEMP;
fi

if [ ! "$JAVA" ] ; then
    if [ "$JAVA_HOME" ] ; then
    JAVA=$JAVA_HOME/bin/java
    else
       JAVA=java
    fi
fi
export $JAVA

if [ ! "$JAVA_OPTS" ] ; then
    JAVA_OPTS="-server"
fi

CP="-cp $CATALINA_HOME/bin/bootstrap.jar"

PROPS="-Djava.io.tmpdir=$ANAGRAM_TEMP \
-Danagram.home=$ANAGRAM_HOME \
-Danagram.base=$ANAGRAM_BASE \
-Danagram.config=$ANAGRAM_CONFIG \
-Dcatalina.home=$CATALINA_HOME \
-Dcatalina.base=$CATALINA_BASE"

export JAVA_OPTS="$JAVA_OPTS $CP $PROPS"
