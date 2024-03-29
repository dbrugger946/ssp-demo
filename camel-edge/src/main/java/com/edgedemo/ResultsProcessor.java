package com.edgedemo;

import io.quarkus.runtime.annotations.RegisterForReflection;
import org.apache.camel.Exchange;
import org.apache.camel.Processor;

@RegisterForReflection
public class ResultsProcessor implements Processor {
    @Override
    public void process(Exchange exchange) throws Exception {
        String custom = exchange.getIn()
            .getBody(String.class); 
        String detections = custom.substring(1, custom.length() - 2);
        exchange.getIn().setHeader("algoResults", detections); 
    }
}

