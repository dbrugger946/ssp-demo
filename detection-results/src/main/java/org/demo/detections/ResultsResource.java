package org.demo.detections;

import javax.inject.Inject;
import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.core.MediaType;

import org.eclipse.microprofile.reactive.messaging.Channel;
import org.jboss.resteasy.annotations.SseElementType;
import org.reactivestreams.Publisher;

/**
 * A bean that simply streams the messages that are being consumed so `index.html` can read and display.
 */
@Path("/decisions")
public class ResultsResource {

    @Inject
    @Channel("incoming_stream")
    Publisher<String> messages;

    @GET
    @Path("/stream")
    @Produces(MediaType.SERVER_SENT_EVENTS)
    @SseElementType(MediaType.TEXT_PLAIN)
    public Publisher<String> stream() {
        return messages;
    }
}